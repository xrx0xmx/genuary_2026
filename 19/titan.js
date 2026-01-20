// Titan - Devorador de realidades que colapsa el universo
class Titan {
  constructor(squareTiles) {
    this.tiles = squareTiles;

    // Calcular posición central del cuadrado
    const centerX = (squareTiles[0].worldX + squareTiles[1].worldX) / 2;
    const centerY = (squareTiles[0].worldY + squareTiles[2].worldY) / 2;

    this.active = true;
    this.position = createVector(centerX, centerY);
    this.radius = 50;
    this.growthRate = 0.5;
    this.maxRadius = 300;
    this.gravitationalPull = 2;
    this.voidParticles = [];
    this.devourCount = 0;

    // Marcar tiles como parte del Titan
    for (let tile of squareTiles) {
      tile.isTitan = true;
    }

    // Crear partículas del vacío
    for (let i = 0; i < 50; i++) {
      this.voidParticles.push({
        pos: createVector(
          random(width),
          random(height)
        ),
        vel: createVector(0, 0),
        alpha: random(100, 255)
      });
    }
  }

  update(allTiles) {
    if (!this.active) return;

    // Crecer gradualmente
    if (this.radius < this.maxRadius) {
      this.radius += this.growthRate;
      this.gravitationalPull += 0.02;
    }

    // Atraer y devorar tiles
    for (let tile of allTiles) {
      if (!tile.active) continue;

      let tilePos = createVector(tile.worldX, tile.worldY);
      let d = p5.Vector.dist(this.position, tilePos);

      // Fuerza gravitacional - mover tiles hacia el Titan
      if (d < 400 && d > this.radius) {
        let force = p5.Vector.sub(this.position, tilePos);
        force.setMag(this.gravitationalPull * 0.1);
        tile.worldX += force.x;
        tile.worldY += force.y;
      }

      // Devorar si está dentro del radio
      if (d < this.radius && tile !== this.tiles[0] && tile !== this.tiles[1] &&
          tile !== this.tiles[2] && tile !== this.tiles[3]) {
        tile.active = false;
        this.devourCount++;

        // Crear explosión de partículas al devorar
        for (let i = 0; i < 5; i++) {
          this.voidParticles.push({
            pos: tilePos.copy(),
            vel: p5.Vector.random2D().mult(random(1, 3)),
            alpha: 255
          });
        }
      }
    }

    // Actualizar partículas del vacío
    for (let i = this.voidParticles.length - 1; i >= 0; i--) {
      let p = this.voidParticles[i];

      // Atraer hacia el centro
      let toCenter = p5.Vector.sub(this.position, p.pos);
      let d = toCenter.mag();
      toCenter.setMag(this.gravitationalPull * 0.5);
      p.vel.add(toCenter);

      p.pos.add(p.vel);
      p.vel.mult(0.95);
      p.alpha -= 1;

      // Remover si llegó al centro o se desvaneció
      if (d < this.radius * 0.5 || p.alpha <= 0) {
        this.voidParticles.splice(i, 1);
      }
    }
  }

  draw() {
    if (!this.active) return;

    push();

    // Dibujar partículas del vacío
    for (let p of this.voidParticles) {
      stroke(255, 0, 100, p.alpha);
      strokeWeight(2);
      point(p.pos.x, p.pos.y);

      // Línea hacia el centro
      stroke(255, 0, 100, p.alpha * 0.3);
      strokeWeight(0.5);
      line(p.pos.x, p.pos.y, this.position.x, this.position.y);
    }

    // Núcleo del Titán - efecto de agujero negro
    translate(this.position.x, this.position.y);

    // Anillos gravitacionales pulsantes
    for (let i = 5; i > 0; i--) {
      let pulseOffset = sin(frameCount * 0.05 + i) * 10;
      let ringRadius = this.radius * (i / 5) + pulseOffset;

      noFill();
      stroke(255, 0, 100, 50 / i);
      strokeWeight(2);
      circle(0, 0, ringRadius * 2);
    }

    // Centro del vacío - oscuridad absoluta
    fill(0, 0, 10);
    noStroke();
    circle(0, 0, this.radius * 1.5);

    // Borde brillante del horizonte de eventos
    stroke(255, 0, 100, 200);
    strokeWeight(3);
    noFill();
    circle(0, 0, this.radius * 2);

    // Distorsión visual tipo remolino
    stroke(255, 0, 100, 100);
    strokeWeight(1);
    for (let i = 0; i < 8; i++) {
      let angle = (frameCount * 0.02 + i * TWO_PI / 8);
      let x1 = cos(angle) * this.radius;
      let y1 = sin(angle) * this.radius;
      let x2 = cos(angle + 0.5) * this.radius * 1.5;
      let y2 = sin(angle + 0.5) * this.radius * 1.5;
      line(x1, y1, x2, y2);
    }

    pop();

    // Texto informativo
    fill(255, 0, 100);
    noStroke();
    textAlign(CENTER);
    text(`TITAN MODE: ${this.devourCount} REALIDADES DEVORADAS`, width/2, 30);
    text(`RADIO DEL VACÍO: ${int(this.radius)}`, width/2, 50);
  }

  isComplete(allTiles) {
    // El final se completa cuando la mayoría de tiles han sido devorados
    let activeTiles = allTiles.filter(t => t.active && !this.tiles.includes(t));
    return activeTiles.length < 10;
  }
}
