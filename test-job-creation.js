#!/usr/bin/env node

/**
 * Test script to verify job creation and visibility
 * Run: node test-job-creation.js
 */

const API_URL = 'http://localhost:3001';

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  } else if (method !== 'GET') {
    // For client-side requests, use cookie format if no Bearer token
    options.headers.Cookie = `tasktimer_user=${encodeURIComponent(JSON.stringify({ id: 'test-user', email: 'test@example.com', role: 'user' }))}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Testing Job Creation Flow\n');

  try {
    // Test 1: Check API health
    console.log('1️⃣  Checking API health...');
    const healthRes = await fetch(`${API_URL}/api/health/db`);
    if (!healthRes.ok) {
      console.error('❌ API is not running at', API_URL);
      console.log('💡 Start the server with: npm run dev:web');
      process.exit(1);
    }
    console.log('✅ API is healthy\n');

    // Test 2: Verify jobs endpoint returns proper schema
    console.log('2️⃣  Verifying jobs endpoint returns correct schema...');
    const testJobData = {
      projectId: 'c9b17676-ca3a-4110-839e-79b6c9fbd1c2',
      taskTypeId: '38401ab2-8ee9-4560-b762-79c39b344de2',
      title: 'Test Job - ' + new Date().toISOString(),
      description: 'This is a test job created by the test script',
    };

    const createRes = await request('POST', '/api/jobs', testJobData);
    
    if (createRes.status !== 201) {
      console.error('❌ Failed to create job. Response:', createRes);
      process.exit(1);
    }

    const job = createRes.data.job;
    console.log('✅ Job created successfully');
    console.log('   Job ID:', job.id);
    console.log('   Project Name:', job.projectName);
    console.log('   Task Type:', job.taskTypeName);
    console.log('   Status:', job.status);
    console.log('   Created At:', job.createdAt);

    // Verify response has all required fields
    const requiredFields = ['id', 'projectId', 'projectName', 'taskTypeId', 'taskTypeName', 'title', 'description', 'status', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in job));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing fields in response:', missingFields);
      console.log('Actual response:', job);
      process.exit(1);
    }
    console.log('✅ All required fields present\n');

    // Test 3: Verify job appears in jobs list
    console.log('3️⃣  Verifying job appears in jobs list...');
    const listRes = await request('GET', '/api/jobs?status=active');
    
    if (listRes.status !== 200) {
      console.error('❌ Failed to fetch jobs. Response:', listRes);
      process.exit(1);
    }

    const jobs = listRes.data.jobs || [];
    const foundJob = jobs.find(j => j.id === job.id);

    if (!foundJob) {
      console.error('❌ Created job not found in list');
      console.error('Created job ID:', job.id);
      console.error('Jobs in list:', jobs.map(j => j.id));
      process.exit(1);
    }

    console.log('✅ Job found in list');
    console.log('   Found job in position:', jobs.indexOf(foundJob) + 1, 'of', jobs.length);
    console.log('   Verifying data matches...');

    // Verify data integrity
    const fieldsToCheck = ['id', 'projectId', 'projectName', 'taskTypeId', 'taskTypeName', 'title', 'status'];
    for (const field of fieldsToCheck) {
      if (foundJob[field] !== job[field]) {
        console.error(`❌ Field mismatch for ${field}:`);
        console.error(`   Created: ${job[field]}`);
        console.error(`   In list: ${foundJob[field]}`);
        process.exit(1);
      }
    }
    console.log('✅ All fields match\n');

    console.log('🎉 All tests passed!\n');
    console.log('Summary:');
    console.log('✅ Job creation endpoint returns complete job details');
    console.log('✅ Created job includes projectName and taskTypeName');
    console.log('✅ Job appears in the jobs list immediately');
    console.log('✅ All data integrity checks passed');
    console.log('\n💡 The fix ensures users can see their jobs immediately after creation!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
