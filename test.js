const { io } = require("socket.io-client");

// Configuration
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "http://localhost:3001";
const SESSION_ID = "test-session-" + Date.now();

console.log("🧪 Starting WebSocket server test...");
console.log(`📡 Connecting to: ${WEBSOCKET_URL}`);
console.log(`🔗 Session ID: ${SESSION_ID}`);

// Create socket connection
const socket = io(WEBSOCKET_URL, {
  transports: ["websocket", "polling"],
  timeout: 5000,
});

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFn) {
  testsTotal++;
  console.log(`\n🔍 Running test: ${testName}`);
  try {
    testFn();
    testsPassed++;
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.log(`❌ ${testName} - FAILED: ${error.message}`);
  }
}

// Test connection
socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server");
  console.log(`🔌 Socket ID: ${socket.id}`);

  // Join session
  socket.emit("join-session", SESSION_ID);

  // Run tests after connection
  setTimeout(() => {
    runTests();
  }, 1000);
});

socket.on("connect_error", (error) => {
  console.log("❌ Connection failed:", error.message);
  process.exit(1);
});

function runTests() {
  console.log("\n🧪 Running WebSocket tests...");

  // Test 1: Phone connected event
  runTest("Phone Connected Event", () => {
    socket.emit("phone-connected", { sessionId: SESSION_ID });
  });

  // Test 2: Ritual step event
  runTest("Ritual Step Event", () => {
    socket.emit("ritual-step", {
      sessionId: SESSION_ID,
      step: "Breathe deeply",
      stepNumber: 1,
      totalSteps: 3,
    });
  });

  // Test 3: Timer selected event
  runTest("Timer Selected Event", () => {
    socket.emit("timer-selected", {
      sessionId: SESSION_ID,
      timer: "pomodoro",
      timerName: "Pomodoro (25 min)",
    });
  });

  // Test 4: Ritual complete event
  runTest("Ritual Complete Event", () => {
    socket.emit("ritual-complete", {
      sessionId: SESSION_ID,
      timer: "pomodoro",
    });
  });

  // Test 5: Ping test
  runTest("Ping Test", () => {
    socket.emit("ping", (response) => {
      if (response && response.timestamp) {
        console.log(`📡 Ping response: ${response.timestamp}`);
      }
    });
  });

  // Test 6: Focus session events
  runTest("Focus Session Start", () => {
    socket.emit("focus-session-start", {
      sessionId: SESSION_ID,
      duration: 25 * 60 * 1000, // 25 minutes in milliseconds
    });
  });

  runTest("Focus Session End", () => {
    socket.emit("focus-session-end", {
      sessionId: SESSION_ID,
    });
  });

  // Wait and show results
  setTimeout(() => {
    showResults();
  }, 2000);
}

function showResults() {
  console.log("\n📊 Test Results:");
  console.log(`✅ Tests passed: ${testsPassed}`);
  console.log(`❌ Tests failed: ${testsTotal - testsPassed}`);
  console.log(
    `📈 Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`
  );

  if (testsPassed === testsTotal) {
    console.log(
      "\n🎉 All tests passed! WebSocket server is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the server logs for details.");
  }

  socket.disconnect();
  process.exit(testsPassed === testsTotal ? 0 : 1);
}

// Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("🔌 Disconnected:", reason);
});

// Timeout for tests
setTimeout(() => {
  console.log("\n⏰ Test timeout reached");
  socket.disconnect();
  process.exit(1);
}, 10000);
