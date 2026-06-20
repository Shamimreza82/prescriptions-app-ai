import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';

const prescribingRate = new Rate('prescription_create_success');
const loginDuration = new Trend('login_duration');
const listPatientsDuration = new Trend('list_patients_duration');
const createPrescriptionDuration = new Trend('create_prescription_duration');
const listPrescriptionsDuration = new Trend('list_prescriptions_duration');
const pdfDownloadDuration = new Trend('pdf_download_duration');
const prescriptionsCreated = new Counter('prescriptions_created');
const errors = new Counter('request_errors');

const testDoctors = new SharedArray('doctors', function () {
  const data = JSON.parse(open('./test-doctors.json'));
  return data.doctors;
});

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'avg<800'],
    http_req_failed: ['rate<0.02'],
    login_duration: ['p(95)<1000'],
    list_patients_duration: ['p(95)<1000'],
    create_prescription_duration: ['p(95)<2000'],
    pdf_download_duration: ['p(95)<5000'],
    prescription_create_success: ['rate>0.95'],
  },
  noConnectionReuse: true,
};

function login(doctor) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: doctor.email,
    password: doctor.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });

  loginDuration.add(res.timings.duration);

  if (!check(res, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => {
      try {
        return JSON.parse(r.body).data.tokens.accessToken !== undefined;
      } catch { return false; }
    },
  })) {
    errors.add(1);
    console.error(`Login failed for ${doctor.email}: ${res.status} ${res.body}`);
    return null;
  }

  return JSON.parse(res.body).data.tokens.accessToken;
}

function getRandomPatient(token) {
  const res = http.get(`${BASE_URL}/patients?limit=50&page=1`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'list_patients' },
  });

  listPatientsDuration.add(res.timings.duration);

  if (!check(res, {
    'list patients status 200': (r) => r.status === 200,
    'list patients has data': (r) => {
      try { return JSON.parse(r.body).data.length > 0; } catch { return false; }
    },
  })) {
    errors.add(1);
    return null;
  }

  const patients = JSON.parse(res.body).data;
  return patients[Math.floor(Math.random() * patients.length)].id;
}

function createPrescription(token, patientId) {
  const payload = {
    patientId,
    symptoms: 'Fever and cough for 3 days',
    chiefComplaint: 'High fever with productive cough',
    diagnosis: 'Upper Respiratory Tract Infection',
    diagnosisNotes: 'Mild fever, throat congestion',
    bloodPressure: '120/80',
    pulseRate: '78/min',
    temperature: '100.5°F',
    oxygenSaturation: '98%',
    medicines: [
      {
        name: 'Napa',
        strength: '500mg',
        form: 'Tablet',
        dosage: '1+0+1',
        frequency: 'After meal',
        duration: '5 Days',
        instructions: 'Take with warm water',
      },
      {
        name: 'Azithromycin',
        strength: '500mg',
        dosage: '1+0+0',
        frequency: 'After meal',
        duration: '3 Days',
        instructions: 'Complete the course',
      },
    ],
    investigations: [
      { name: 'CBC', notes: 'Check WBC count' },
    ],
    advice: 'Take adequate rest. Drink plenty of fluids.',
    foodAdvice: 'Light diet. Avoid oily food.',
    notes: 'Follow up in 5 days if no improvement',
  };

  const res = http.post(`${BASE_URL}/prescriptions`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'create_prescription' },
  });

  createPrescriptionDuration.add(res.timings.duration);
  const success = res.status === 201;

  if (success) {
    prescriptionsCreated.add(1);
  } else {
    errors.add(1);
  }

  prescribingRate.add(success);

  if (!check(res, {
    'create prescription status 201': (r) => r.status === 201,
    'create prescription has id': (r) => {
      try { return JSON.parse(r.body).data.id !== undefined; } catch { return false; }
    },
  })) {
    console.error(`Create prescription failed: ${res.status} ${res.body}`);
    return null;
  }

  return JSON.parse(res.body).data.id;
}

function listPrescriptions(token) {
  const res = http.get(`${BASE_URL}/prescriptions?limit=20&page=1`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'list_prescriptions' },
  });

  listPrescriptionsDuration.add(res.timings.duration);

  check(res, {
    'list prescriptions status 200': (r) => r.status === 200,
    'list prescriptions has data': (r) => {
      try { return r.status === 200; } catch { return false; }
    },
  });
}

function downloadPdf(token, prescriptionId) {
  const res = http.get(`${BASE_URL}/prescriptions/${prescriptionId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'download_pdf' },
    responseType: 'text',
  });

  pdfDownloadDuration.add(res.timings.duration);

  check(res, {
    'pdf download status 200': (r) => r.status === 200,
    'pdf has content-type': (r) => r.headers['Content-Type'] === 'application/pdf',
  });
}

export default function () {
  const doctorIndex = __VU - 1;
  const doctor = testDoctors[doctorIndex % testDoctors.length];
  const token = login(doctor);

  if (!token) {
    sleep(1);
    return;
  }

  group('Doctor Prescribing Flow', function () {
    const patientId = getRandomPatient(token);
    if (!patientId) {
      sleep(1);
      return;
    }

    const prescriptionId = createPrescription(token, patientId);
    if (!prescriptionId) {
      sleep(1);
      return;
    }

    listPrescriptions(token);

    if (__VU <= 10) {
      downloadPdf(token, prescriptionId);
    }
  });

  sleep(Math.random() * 2 + 1);
}

export function setup() {
  const doctorCount = testDoctors.length;
  console.log(`Found ${doctorCount} test doctors. Starting load test...`);

  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    fail(`Backend health check failed: ${healthCheck.status} ${healthCheck.body}`);
  }
  console.log('Backend health check passed.');

  return { doctorCount };
}

export function teardown() {
  console.log('Load test completed.');
}
