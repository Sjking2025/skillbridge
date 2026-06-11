fetch('http://localhost:3000/api/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: "Test",
    email: "test@test.com",
    college: "Test",
    year: "1st",
    level: "Beginner"
  })
}).then(res => res.json().then(data => console.log(res.status, data))).catch(console.error);
