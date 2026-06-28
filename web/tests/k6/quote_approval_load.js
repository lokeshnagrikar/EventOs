import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '15s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

export default function () {
  // Step 1: Login to acquire JWT token
  const loginPayload = JSON.stringify({
    email: 'admin@eventos.com',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json().data && r.json().data.accessToken,
  });

  if (!loginSuccess) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
    sleep(1);
    return;
  }

  const token = loginRes.json().data.accessToken;
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // Step 2: Create a mock Lead
  const leadPayload = JSON.stringify({
    name: `Load Test Lead ${__VU}-${__ITER}`,
    email: `loadtest-${__VU}-${__ITER}@example.com`,
    phone: '9876543210',
    companyName: 'Load Test Corp',
    eventDate: '2026-07-20',
    guestCount: 150,
    budget: 500000,
    status: 'INQUIRY',
  });

  const leadRes = http.post(`${BASE_URL}/crm/leads`, leadPayload, authHeaders);
  const leadCreated = check(leadRes, {
    'lead creation status is 201 or 200': (r) => r.status === 200 || r.status === 201,
    'has lead id': (r) => r.json().data && r.json().data.id,
  });

  if (!leadCreated) {
    console.error(`Lead creation failed: ${leadRes.status} ${leadRes.body}`);
    sleep(1);
    return;
  }

  const leadId = leadRes.json().data.id;

  // Step 3: Create a mock Quote
  const quotePayload = JSON.stringify({
    leadId: leadId,
    title: `Load Test Proposal ${__VU}-${__ITER}`,
    description: 'Automatic load test generated quote',
    subtotal: 400000,
    tax: 72000,
    discount: 0,
    total: 472000,
    status: 'DRAFT',
    items: [
      {
        name: 'Venue Catering Service',
        description: 'Premium buffet menu for 150 guests',
        quantity: 1,
        unitPrice: 300000,
        totalPrice: 300000,
      },
      {
        name: 'Sound & Lighting setup',
        description: 'Concert grade sound system and LED screen',
        quantity: 1,
        unitPrice: 100000,
        totalPrice: 100000,
      }
    ],
  });

  const quoteRes = http.post(`${BASE_URL}/crm/quotes`, quotePayload, authHeaders);
  const quoteCreated = check(quoteRes, {
    'quote creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'has quote id': (r) => r.json().data && r.json().data.id,
  });

  if (!quoteCreated) {
    console.error(`Quote creation failed: ${quoteRes.status} ${quoteRes.body}`);
    sleep(1);
    return;
  }

  const quoteId = quoteRes.json().data.id;

  // Step 4: Progress Quote status through required states: DRAFT -> SENT -> VIEWED -> ACCEPTED
  const updateStatus = (status) => {
    return http.put(
      `${BASE_URL}/crm/quotes/${quoteId}/status`, 
      JSON.stringify({ status: status }), 
      authHeaders
    );
  };

  const sentRes = updateStatus('SENT');
  check(sentRes, { 'quote status is SENT': (r) => r.status === 200 });

  const viewedRes = updateStatus('VIEWED');
  check(viewedRes, { 'quote status is VIEWED': (r) => r.status === 200 });

  const acceptedRes = updateStatus('ACCEPTED');
  check(acceptedRes, { 'quote status is ACCEPTED': (r) => r.status === 200 });

  // Step 5: Perform Quote Approval (The targeted operation)
  const approvalRes = http.post(`${BASE_URL}/crm/quotes/${quoteId}/approve`, null, authHeaders);
  
  check(approvalRes, {
    'quote approval returns success status': (r) => r.status === 200,
    'quote response includes approvedAt': (r) => r.json().data && r.json().data.approvedAt !== null,
  });

  sleep(1);
}
