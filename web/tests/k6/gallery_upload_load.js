import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '15s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Error rate should be less than 5% (media uploads can have network issues)
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2000ms (upload takes longer than standard APIs)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

// Generate a dummy image in memory to simulate a multipart file upload
const dummyImage = 'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;';

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
  
  const jsonHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // Step 2: Create a test album in gallery service
  const albumPayload = JSON.stringify({
    name: `Load Test Album ${__VU}`,
    description: 'Album for simulating concurrent media uploads',
    eventId: null,
  });

  const albumRes = http.post(`${BASE_URL}/gallery/albums`, albumPayload, jsonHeaders);
  const albumCreated = check(albumRes, {
    'album creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'has album id': (r) => r.json().data && r.json().data.id,
  });

  if (!albumCreated) {
    console.error(`Album creation failed: ${albumRes.status} ${albumRes.body}`);
    sleep(1);
    return;
  }

  const albumId = albumRes.json().data.id;

  // Step 3: Perform Multipart File Upload
  // http.file() helper creates a file attachment object for multipart requests
  const filePart = http.file(dummyImage, `loadtest_${__VU}_${__ITER}.gif`, 'image/gif');
  
  const fd = {
    file: filePart,
    albumId: albumId,
  };

  const uploadRes = http.post(`${BASE_URL}/gallery/upload`, fd, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(uploadRes, {
    'media upload returns created status': (r) => r.status === 201 || r.status === 200,
    'upload body contains data with publicId': (r) => r.json().data && r.json().data.publicId !== undefined,
  });

  sleep(2);
}
