async function test() {
  const rq = 100; 
  const results = { success: 0, ratelimited: 0, other: 0 };

  console.log(`Sending ${rq} requests -.-`);

  const requests = Array.from({ length: rq }, async (_, i) => {
    const res = await fetch("http://localhost:3000/api/amy/random");

    if (res.status === 200) {
      results.success++;
      console.log(`[${i + 1}]200 OK`);
    } else if (res.status === 429) {
      results.ratelimited++;
      console.log(`[${i + 1}]429 Rate Limited`);
    } else {
      results.other++;
      console.log(`[${i + 1}]${res.status}`);
    }
  });

  await Promise.all(requests);

  console.log("\nResults:\n");
  console.log(`Success:\n${results.success}`);
  console.log(`Rate limited:\n${results.ratelimited}`);
  console.log(`Other:\n${results.other}`);
}
console.log("Use this only for this API to test locally :p")
test();