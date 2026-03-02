let scene, camera, renderer;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let board = [];
let currentPlayer = "X";
let gameOver = false;
let cells = [];
let symbols = [];

init();
animate();

function init() {
  scene = new THREE.Scene();

  // Initial camera setup (distance corrected in onResize)
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createGrid();
  createCells();

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("touchstart", onPointerDown, { passive: false });

  window.addEventListener("resize", onResize);

  // Initial resize to fit current screen
  onResize();
}

function createGrid() {
  let material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const positions = [-0.5, 0.5];

  positions.forEach(x => {
    let points = [new THREE.Vector3(x, -1.5, 0), new THREE.Vector3(x, 1.5, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  });

  positions.forEach(y => {
    let points = [new THREE.Vector3(-1.5, y, 0), new THREE.Vector3(1.5, y, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  });
}

function createCells() {
  let index = 0;
  for (let y = 1; y >= -1; y--) {
    for (let x = -1; x <= 1; x++) {
      let geometry = new THREE.PlaneGeometry(0.9, 0.9);
      let material = new THREE.MeshBasicMaterial({ visible: false });
      let cell = new THREE.Mesh(geometry, material);
      cell.position.set(x, y, 0);
      cell.userData.index = index;
      scene.add(cell);
      cells.push(cell);
      board.push("");
      index++;
    }
  }
}

function onPointerDown(event) {
  if (gameOver) return;

  event.preventDefault();

  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX || event.touches?.[0]?.clientX;
  const clientY = event.clientY || event.touches?.[0]?.clientY;

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(cells);

  if (intersects.length > 0) {
    let index = intersects[0].object.userData.index;
    if (board[index] === "") {
      board[index] = currentPlayer;
      placeSymbol(index, currentPlayer);
      checkWinner();
      if (!gameOver) {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
      }
    }
  }
}

function placeSymbol(index, player) {
  let x = (index % 3) - 1;
  let y = 1 - Math.floor(index / 3);

  if (player === "X") {
    let material = new THREE.LineBasicMaterial({ color: 0xffffff });
    let p1 = [new THREE.Vector3(x - 0.3, y - 0.3, 0.1), new THREE.Vector3(x + 0.3, y + 0.3, 0.1)];
    let p2 = [new THREE.Vector3(x - 0.3, y + 0.3, 0.1), new THREE.Vector3(x + 0.3, y - 0.3, 0.1)];
    let l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p1), material);
    let l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p2), material);
    scene.add(l1); scene.add(l2);
    symbols.push(l1, l2);
  } else {
    let geometry = new THREE.RingGeometry(0.25, 0.3, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    let circle = new THREE.Mesh(geometry, material);
    circle.position.set(x, y, 0.1);
    scene.add(circle);
    symbols.push(circle);
  }
}

function checkWinner() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of wins) {
    let [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      showModal("Player " + board[a] + " Wins!");
      gameOver = true;
      return;
    }
  }

  if (!board.includes("")) {
    showModal("It's a Draw!");
    gameOver = true;
  }
}

function resetGame() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  symbols.forEach(s => scene.remove(s));
  symbols = [];
  document.getElementById("dropdown").style.display = "none";
}

function toggleMenu() {
  let d = document.getElementById("dropdown");
  d.style.display = d.style.display === "block" ? "none" : "block";
}

function showModal(text) {
  document.getElementById("modalText").innerText = text;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  resetGame();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ✅ Fully responsive camera for portrait & landscape
function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  camera.aspect = aspect;

  const gridSize = 3; // 3x3 grid
  const fov = camera.fov * (Math.PI / 180);

  // Calculate distances for width and height
  const distWidth = (gridSize / 2) / Math.tan(fov / 2) * 1.1;
  const distHeight = (gridSize / 2) / Math.tan(fov / 2 / aspect) * 1.1;

  // Use max distance so grid fits both dimensions
  camera.position.z = Math.max(distWidth, distHeight);

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
