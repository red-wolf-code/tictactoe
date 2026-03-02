let scene, camera, renderer;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let board = [];
let currentPlayer = "X";
let gameOver = false;
let cells = [];
let symbols = [];
let symbolGroup;
let gridGroup;

init();
animate();

function init() {
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;  // camera z auto-adjusts later

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Groups
  gridGroup = new THREE.Group();
  scene.add(gridGroup);

  symbolGroup = new THREE.Group();
  scene.add(symbolGroup);

  createGridPlanes();
  createCells();

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("touchstart", onPointerDown, { passive: false });

  window.addEventListener("resize", onResize);

  onResize();
}

// Use thin planes for the grid
function createGridPlanes() {
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Vertical lines
  for (let i = -1; i <= 1; i += 2) {
    const geometry = new THREE.PlaneGeometry(0.05, 3); // thin vertical plane
    const mesh = new THREE.Mesh(geometry, lineMaterial);
    mesh.position.x = i;
    gridGroup.add(mesh);
  }

  // Horizontal lines
  for (let i = -1; i <= 1; i += 2) {
    const geometry = new THREE.PlaneGeometry(3, 0.05); // thin horizontal plane
    const mesh = new THREE.Mesh(geometry, lineMaterial);
    mesh.position.y = i;
    gridGroup.add(mesh);
  }
}

function createCells() {
  let index = 0;
  for (let y = 1; y >= -1; y--) {
    for (let x = -1; x <= 1; x++) {
      const geometry = new THREE.PlaneGeometry(0.9, 0.9);
      const material = new THREE.MeshBasicMaterial({ visible: false });
      const cell = new THREE.Mesh(geometry, material);
      cell.position.set(x, y, 0.1);
      cell.userData.index = index;
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
  const intersects = raycaster.intersectObjects(cells);

  if (intersects.length > 0) {
    const index = intersects[0].object.userData.index;
    if (board[index] === "") {
      board[index] = currentPlayer;
      placeSymbol(index, currentPlayer);
      checkWinner();
      if (!gameOver) currentPlayer = currentPlayer === "X" ? "O" : "X";
    }
  }
}

function placeSymbol(index, player) {
  let x = (index % 3) - 1;
  let y = 1 - Math.floor(index / 3);

  if (player === "X") {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const p1 = [new THREE.Vector3(x - 0.3, y - 0.3, 0.1), new THREE.Vector3(x + 0.3, y + 0.3, 0.1)];
    const p2 = [new THREE.Vector3(x - 0.3, y + 0.3, 0.1), new THREE.Vector3(x + 0.3, y - 0.3, 0.1)];
    const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p1), material);
    const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p2), material);
    symbolGroup.add(l1, l2);
    symbols.push(l1, l2);
  } else {
    const geometry = new THREE.RingGeometry(0.25, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(x, y, 0.1);
    symbolGroup.add(circle);
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
    const [a,b,c] = combo;
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
  symbols.forEach(s => symbolGroup.remove(s));
  symbols = [];
  document.getElementById("dropdown").style.display = "none";
}

function toggleMenu() {
  const d = document.getElementById("dropdown");
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

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Adjust camera z so the grid fits the screen
  const scale = Math.min(width / height, 1);
  camera.position.z = 4.5 / scale;

  // Scale symbols to fill squares
  const symbolScale = 0.9 / 2.5 * camera.position.z; // proportional to camera distance
  symbolGroup.scale.set(symbolScale, symbolScale, 1);
}
