
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.3",
    "info": {
      "title": "Multi-Tenant SaaS Backend API",
      "version": "1.0.0",
      "description": "API documentation for the medicine-backend project, including authentication, roles, tenants, medicine management, and lab test functionalities."
    },
    "servers": [
      {
        "url": "http://localhost:4000/api/v1",
        "description": "Version 1 API"
      }
    ],
    "tags": [
      {
        "name": "Health"
      },
      {
        "name": "Medicine"
      },
      {
        "name": "Medicine Brands"
      },
      {
        "name": "Medicine Generics"
      },
      {
        "name": "Medicine Diseases"
      },
      {
        "name": "Medicine Warnings"
      },
      {
        "name": "Lab Tests"
      }
    ],
    "paths": {
      "/medicines/search": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Combined search for brands, generics, indications, and companies",
          "operationId": "combinedSearch",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false,
              "description": "Search query string"
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              },
              "required": false,
              "description": "Limit results per category"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful search",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CombinedSearchResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/brands": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Search for medicine brands",
          "operationId": "searchBrands",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              },
              "required": false
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              },
              "required": false
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of brands",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedBrands"
                  }
                }
              }
            }
          }
        },
        "post": {
          "tags": [
            "Medicine"
          ],
          "summary": "Create a new brand",
          "operationId": "createBrand",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateBrand"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Brand created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Brand"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/brands/{id}": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get brand by ID",
          "operationId": "getBrandById",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of brand",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Brand"
                  }
                }
              }
            },
            "404": {
              "description": "Brand not found"
            }
          }
        },
        "patch": {
          "tags": [
            "Medicine"
          ],
          "summary": "Update a brand",
          "operationId": "updateBrand",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateBrand"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Brand updated successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Brand"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/generics": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Search for medicine generics",
          "operationId": "searchGenerics",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              },
              "required": false
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              },
              "required": false
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of generics",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedGenerics"
                  }
                }
              }
            }
          }
        },
        "post": {
          "tags": [
            "Medicine"
          ],
          "summary": "Create a new generic",
          "operationId": "createGeneric",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateGeneric"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Generic created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Generic"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/generics/{id}": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get generic by ID",
          "operationId": "getGenericById",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of generic",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Generic"
                  }
                }
              }
            },
            "404": {
              "description": "Generic not found"
            }
          }
        },
        "patch": {
          "tags": [
            "Medicine"
          ],
          "summary": "Update a generic",
          "operationId": "updateGeneric",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateGeneric"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Generic updated successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Generic"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/indications": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Search for indications",
          "operationId": "searchIndications",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              },
              "required": false
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              },
              "required": false
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of indications",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedIndications"
                  }
                }
              }
            }
          }
        },
        "post": {
          "tags": [
            "Medicine"
          ],
          "summary": "Create a new indication",
          "operationId": "createIndication",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateIndication"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Indication created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Indication"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/indications/{id}": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get indication by ID",
          "operationId": "getIndicationById",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of indication",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Indication"
                  }
                }
              }
            },
            "404": {
              "description": "Indication not found"
            }
          }
        },
        "patch": {
          "tags": [
            "Medicine"
          ],
          "summary": "Update an indication",
          "operationId": "updateIndication",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateIndication"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Indication updated successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Indication"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/companies": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Search for medicine companies",
          "operationId": "searchCompanies",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 10
              },
              "required": false
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              },
              "required": false
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of companies",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedCompanies"
                  }
                }
              }
            }
          }
        },
        "post": {
          "tags": [
            "Medicine"
          ],
          "summary": "Create a new company",
          "operationId": "createCompany",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCompany"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Company created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Company"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/companies/{id}": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get company by ID",
          "operationId": "getCompanyById",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "responses": {
            "200": {
              "description": "Successful retrieval of company",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Company"
                  }
                }
              }
            },
            "404": {
              "description": "Company not found"
            }
          }
        },
        "patch": {
          "tags": [
            "Medicine"
          ],
          "summary": "Update a company",
          "operationId": "updateCompany",
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "schema": {
                "type": "integer"
              },
              "required": true
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCompany"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Company updated successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Company"
                  }
                }
              }
            }
          }
        }
      },
      "/medicines/stats": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get medicine module statistics",
          "operationId": "getStats",
          "responses": {
            "200": {
              "description": "Successful retrieval of statistics"
            }
          }
        }
      },
      "/medicines/pregnancy-categories": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get all pregnancy categories",
          "operationId": "getPregnancyCategories",
          "responses": {
            "200": {
              "description": "Successful retrieval of pregnancy categories"
            }
          }
        }
      },
      "/medicines/classifications": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get medicine classification tree",
          "operationId": "getClassificationTree",
          "responses": {
            "200": {
              "description": "Successful retrieval of classification tree"
            }
          }
        }
      },
      "/medicines/dosage-forms": {
        "get": {
          "tags": [
            "Medicine"
          ],
          "summary": "Get distinct dosage forms",
          "operationId": "getDistinctForms",
          "responses": {
            "200": {
              "description": "Successful retrieval of dosage forms"
            }
          }
        }
      },
      "/lab-tests/search": {
        "get": {
          "tags": [
            "Lab Tests"
          ],
          "summary": "Search for lab tests",
          "operationId": "searchLabTests",
          "parameters": [
            {
              "in": "query",
              "name": "q",
              "schema": {
                "type": "string"
              },
              "required": false,
              "description": "Search query for lab tests"
            },
            {
              "in": "query",
              "name": "category",
              "schema": {
                "type": "string"
              },
              "required": false,
              "description": "Filter by lab test category"
            },
            {
              "in": "query",
              "name": "specimen",
              "schema": {
                "type": "string"
              },
              "required": false,
              "description": "Filter by specimen type"
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "format": "int32",
                "minimum": 1,
                "maximum": 50,
                "default": 10
              },
              "required": false,
              "description": "Number of results to return (default: 10, max: 50)"
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "format": "int32",
                "minimum": 1,
                "default": 1
              },
              "required": false,
              "description": "Page number (default: 1)"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful search",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedLabTests"
                  }
                }
              }
            },
            "400": {
              "$ref": "#/components/schemas/BadRequestError"
            }
          }
        }
      }
    },
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      },
      "schemas": {
        "PaginationMeta": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          }
        },
        "Brand": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            },
            "form": {
              "type": "string",
              "nullable": true
            },
            "strength": {
              "type": "string",
              "nullable": true
            },
            "price": {
              "type": "string",
              "nullable": true
            },
            "packSize": {
              "type": "string",
              "nullable": true
            },
            "isSponsored": {
              "type": "boolean"
            },
            "company": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer"
                },
                "name": {
                  "type": "string"
                }
              }
            },
            "generic": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer"
                },
                "name": {
                  "type": "string"
                }
              }
            }
          }
        },
        "Generic": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            },
            "indication": {
              "type": "string",
              "nullable": true
            },
            "therapeuticClass": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "Indication": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            }
          }
        },
        "Company": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            }
          }
        },
        "CreateBrand": {
          "type": "object",
          "required": [
            "name",
            "companyId",
            "genericId"
          ],
          "properties": {
            "name": {
              "type": "string"
            },
            "companyId": {
              "type": "integer"
            },
            "genericId": {
              "type": "integer"
            },
            "form": {
              "type": "string"
            },
            "packSize": {
              "type": "string"
            },
            "price": {
              "type": "string"
            },
            "strength": {
              "type": "string"
            },
            "isSponsored": {
              "type": "boolean"
            }
          }
        },
        "CreateGeneric": {
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "name": {
              "type": "string"
            },
            "indication": {
              "type": "string"
            },
            "administration": {
              "type": "string"
            },
            "adultDose": {
              "type": "string"
            },
            "childDose": {
              "type": "string"
            },
            "renalDose": {
              "type": "string"
            },
            "contraIndication": {
              "type": "string"
            },
            "precaution": {
              "type": "string"
            },
            "sideEffect": {
              "type": "string"
            },
            "interaction": {
              "type": "string"
            },
            "modeOfAction": {
              "type": "string"
            },
            "pregnancyCategoryId": {
              "type": "integer",
              "nullable": true
            },
            "pregnancyCategoryNote": {
              "type": "string"
            }
          }
        },
        "CreateIndication": {
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "name": {
              "type": "string"
            }
          }
        },
        "CreateCompany": {
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "name": {
              "type": "string"
            },
            "order": {
              "type": "integer"
            }
          }
        },
        "CombinedSearchResponse": {
          "type": "object",
          "properties": {
            "brands": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Brand"
              }
            },
            "generics": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Generic"
              }
            },
            "indications": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Indication"
              }
            },
            "companies": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Company"
              }
            }
          }
        },
        "PaginatedBrands": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Brand"
              }
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "PaginatedGenerics": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Generic"
              }
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "PaginatedIndications": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Indication"
              }
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "PaginatedCompanies": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Company"
              }
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "LabTestSearchQuery": {
          "type": "object",
          "properties": {
            "q": {
              "type": "string",
              "description": "Search query for lab tests"
            },
            "category": {
              "type": "string",
              "description": "Filter by lab test category"
            },
            "specimen": {
              "type": "string",
              "description": "Filter by specimen type"
            },
            "limit": {
              "type": "integer",
              "format": "int32",
              "minimum": 1,
              "maximum": 50,
              "default": 10,
              "description": "Number of results to return"
            },
            "page": {
              "type": "integer",
              "format": "int32",
              "minimum": 1,
              "default": 1,
              "description": "Page number"
            }
          }
        },
        "LabTest": {
          "type": "object",
          "description": "Represents a lab test item.",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "slug": {
              "type": "string"
            },
            "shortName": {
              "type": "string",
              "nullable": true
            },
            "category": {
              "type": "string",
              "nullable": true
            },
            "description": {
              "type": "string",
              "nullable": true
            },
            "specimen": {
              "type": "string",
              "nullable": true
            },
            "preparation": {
              "type": "string",
              "nullable": true
            },
            "normalRange": {
              "type": "string",
              "nullable": true
            },
            "unit": {
              "type": "string",
              "nullable": true
            },
            "isActive": {
              "type": "boolean"
            }
          },
          "required": [
            "id",
            "name"
          ]
        },
        "PaginatedLabTests": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/LabTest"
              }
            },
            "meta": {
              "$ref": "#/components/schemas/PaginationMeta"
            }
          }
        },
        "StandardSuccessResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "message": {
              "type": "string",
              "example": "Operation successful"
            },
            "data": {
              "type": "object",
              "nullable": true
            }
          }
        },
        "ErrorResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": false
            },
            "message": {
              "type": "string",
              "example": "Something went wrong"
            },
            "error": {
              "type": "object",
              "nullable": true
            }
          }
        },
        "ValidationErrorResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": false
            },
            "message": {
              "type": "string",
              "example": "Invalid input data"
            },
            "error": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "field": {
                    "type": "string",
                    "example": "body.name"
                  },
                  "error": {
                    "type": "string",
                    "example": "Hospital name must be at least 2 characters"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
