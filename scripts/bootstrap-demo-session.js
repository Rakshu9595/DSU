/**
 * bootstrap-demo-session.js
 * Calls the live running VisionTwin Express server at http://127.0.0.1:5000
 * to register the demo account, create a project, and add sample appliances.
 */

async function main() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('Connecting to running VisionTwin API at', baseUrl);

  // 1. Register or login demo account
  let cookie = '';
  try {
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Piyush Sharma',
        email: 'demo@visiontwin.io',
        password: 'Password123!'
      })
    });
    const setCookie = regRes.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await regRes.json();
    console.log('Registration status:', regRes.status, data.message || data.status);
  } catch (e) {
    console.log('Registration attempt:', e.message);
  }

  if (!cookie) {
    // Try logging in
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@visiontwin.io',
        password: 'Password123!'
      })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await loginRes.json();
    console.log('Login status:', loginRes.status, data.message || data.status);
  }

  if (!cookie) {
    console.error('Failed to obtain session cookie');
    return;
  }

  console.log('Session established:', cookie);

  // 2. Create sample project: "Living Room Twin"
  const projRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Smart Living Room & Studio',
      roomType: 'living_room',
      electricityTariffPerKwh: 8.0,
      roomDimensions: {
        length: 6.0,
        width: 5.0,
        height: 3.0
      },
      description: 'Living room with high-efficiency ceiling fan, inverter AC, smart TV, and wall switchboards.'
    })
  });
  const projData = await projRes.json();
  const project = projData.data.project || projData.data;
  console.log('Created demo project:', project._id, project.name);

  // 3. Add sample appliances
  const sampleDevices = [
    {
      projectId: project._id,
      canonicalName: 'ceiling_fan',
      displayName: 'High-Efficiency BLDC Ceiling Fan',
      category: 'cooling',
      powerRatingWatts: 35,
      powerRatingSource: 'user_entered',
      powerRatingVerified: true,
      dailyUsageHours: 10,
      daysUsedPerMonth: 30,
      manufacturer: 'Atomberg',
      modelNumber: 'Renesa Smart 1200mm'
    },
    {
      projectId: project._id,
      canonicalName: 'air_conditioner',
      displayName: 'Dual Inverter 1.5 Ton Split AC',
      category: 'cooling',
      powerRatingWatts: 1450,
      powerRatingSource: 'reference_estimate',
      powerRatingVerified: false,
      dailyUsageHours: 6,
      daysUsedPerMonth: 25,
      isVariablePower: true,
      manufacturer: 'LG',
      modelNumber: 'AI Dual Inverter 5-Star'
    },
    {
      projectId: project._id,
      canonicalName: 'television',
      displayName: '55" OLED 4K Smart TV',
      category: 'entertainment',
      powerRatingWatts: 110,
      powerRatingSource: 'user_entered',
      powerRatingVerified: true,
      dailyUsageHours: 4,
      daysUsedPerMonth: 30,
      manufacturer: 'Sony',
      modelNumber: 'Bravia XR-55A80L'
    },
    {
      projectId: project._id,
      canonicalName: 'laptop',
      displayName: 'Workstation Laptop & Docking Hub',
      category: 'computing',
      powerRatingWatts: 85,
      powerRatingSource: 'user_entered',
      powerRatingVerified: true,
      dailyUsageHours: 8,
      daysUsedPerMonth: 22,
      manufacturer: 'Lenovo',
      modelNumber: 'ThinkPad P1 Gen 6'
    },
    {
      projectId: project._id,
      canonicalName: 'refrigerator',
      displayName: 'Frost-Free Inverter Refrigerator',
      category: 'refrigeration',
      powerRatingWatts: 180,
      powerRatingSource: 'reference_estimate',
      powerRatingVerified: false,
      dailyUsageHours: 24,
      daysUsedPerMonth: 30,
      isVariablePower: true,
      manufacturer: 'Samsung',
      modelNumber: 'Curd Maestro 3-Star'
    },
    {
      projectId: project._id,
      canonicalName: 'switch',
      displayName: 'Main 4-Gang Lighting Switchboard',
      category: 'other',
      isFitting: true,
      fittingType: 'switch',
      fittingStatus: 'unknown',
      powerRatingWatts: 0,
      powerRatingSource: 'unknown',
      powerRatingVerified: false,
      dailyUsageHours: 0,
      daysUsedPerMonth: 0
    },
    {
      projectId: project._id,
      canonicalName: 'power_socket',
      displayName: '16A Heavy Load Wall Power Socket',
      category: 'other',
      isFitting: true,
      fittingType: 'power_socket',
      powerRatingWatts: 0,
      powerRatingSource: 'unknown',
      powerRatingVerified: false,
      dailyUsageHours: 0,
      daysUsedPerMonth: 0
    }
  ];

  for (const dev of sampleDevices) {
    const res = await fetch(`${baseUrl}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(dev)
    });
    const d = await res.json();
    console.log(`Added device: ${dev.displayName} (${dev.isFitting ? 'Fitting' : dev.powerRatingWatts + 'W'})`);
  }

  // 4. Test calculation
  const energyRes = await fetch(`${baseUrl}/energy/project/${project._id}`, {
    headers: { 'Cookie': cookie }
  });
  const energyData = await energyRes.json();
  const est = energyData.data.estimate;
  console.log('\n--- CALCULATED ENERGY METRICS ---');
  console.log(`Total Monthly Energy: ${est.totalMonthlyEnergyKwh} kWh`);
  console.log(`Estimated Monthly Cost: ₹${est.estimatedMonthlyCost}`);
  console.log(`Carbon Emissions: ${est.estimatedCarbonEmissionsKg} kg CO2/month`);
  console.log('Demo environment ready for browser validation!');
}

main().catch(console.error);
