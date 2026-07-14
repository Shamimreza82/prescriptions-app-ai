'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Stethoscope, User, Calendar, Pill } from 'lucide-react';

export default function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:5000/api`;
    fetch(`${apiBase}/verify/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.message || 'Invalid prescription');
      })
      .catch(() => setError('Failed to verify prescription'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Verify the authenticity of this prescription</p>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Verifying prescription...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-emerald-500 p-4 text-center">
              <CheckCircle className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-white font-bold text-sm">Verified Prescription</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Prescription No</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{data.prescriptionNo}</span>
              </div>

              <div>
                <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Patient
                </h3>
                <p className="text-sm font-bold text-gray-900">{data.patient?.fullName}</p>
                <p className="text-xs text-gray-500">{data.patient?.age}Y · {data.patient?.gender?.charAt(0)}</p>
              </div>

              <div>
                <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Prescribed By
                </h3>
                <p className="text-sm font-bold text-gray-900">{data.doctor?.fullName}</p>
                <p className="text-xs text-gray-500">
                  {(data.doctor?.degree || []).join(', ')}
                  {data.doctor?.clinicName && ` · ${data.doctor.clinicName}`}
                </p>
                {data.doctor?.bmdcRegNo && (
                  <p className="text-xs text-gray-400 mt-0.5">BMDC: {data.doctor.bmdcRegNo}</p>
                )}
              </div>

              <div>
                <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </h3>
                <p className="text-sm text-gray-700">
                  {new Date(data.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>

              {data.medicines?.length > 0 && (
                <div>
                  <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" /> Medicines
                  </h3>
                  <ul className="space-y-1">
                    {data.medicines.map((m: any, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        {m.name}{m.strength ? ` ${m.strength}` : ''} — {m.dosage} · {m.frequency} · {m.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400">This is a digitally generated prescription verified through MEDICLOUD.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
