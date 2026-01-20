// Nucleo - Emisor de pulsos transmutadores que convierten tiles
class Nucleo {
  constructor(squareTiles) {
    this.tiles = squareTiles;

    // Calcular posición central del cuadrado
    const centerX = (squareTiles[0].worldX + squareTiles[1].worldX) / 2;
    const centerY = (squareTiles[0].worldY + squareTiles[2].worldY) / 2;

    this.active = true;
    this.position = createVector(centerX, centerY);
    this.pulseRadius = 0;
    this.maxPulseRadius = 400;
    this.pulseSpeed = 3;
    this.pulses = [];
    this.convertedTiles = new Set();
    this.transmutedCount = 0;
    this.energyRings = [];

    // Marcar tiles como parte del Núcleo
    for (let tile of squareTiles) {
      tile.isNucleo = true;
      this.convertedTiles.add(tile);
    }

    // Crear anillos de energía iniciales
    for (let i = 0; i < 5; i++) {
      this.energyRings.push({
        radius: random(50, 150),
        speed: random(0.5, 1.5),
        phase: random(TWO_PI)
      });
    }
  }

  emitPulse() {
    this.pulses.push({
      pos: this.position.copy(),
      radius: 0,
      alpha: 255,
      power: 1.0
    });
  }

  update(agents) {
    if (!this.active) return;

    // Emitir pulso automático cada cierto tiempo
    if (frameCount % 60 === 0) {
      this.emitPulse();
    }

    // Actualizar pulsos
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      let pulse = this.pulses[i];
      pulse.radius += this.pulseSpeed;
      pulse.alpha -= 2;
      pulse.power -= 0.005;

      // Detectar colisiones con agentes
      for (let agent of agents) {
        if (!agent.active || this.convertedAgents.has(agent)) continue;

        let d = p5.Vector.dist(pulse.pos, agent.pos);

        // Si el pulso toca al agente, transmutarlo
        if (abs(d - pulse.radius) < 20 && pulse.power > 0.3) {
          this.transmuteAgent(agent);
          this.convertedAgents.add(agent);
          this.transmutedCount++;
        }
      }

      // Remover pulso si está completo
      if (pulse.alpha <= 0 || pulse.radius > this.maxPulseRadius) {
        this.pulses.splice(i, 1);
      }
    }

    // Actualizar anillos de energía
    for (let ring of this.energyRings) {
      ring.phase += ring.speed * 0.02;
    }

    // Comportamiento de agentes transmutados
    for (let agent of this.convertedAgents) {
      if (!agent.active) continue;

      // Orbitar alrededor del núcleo
      let toCenter = p5.Vector.sub(this.position, agent.pos);
      let d = toCenter.mag();

      // Fuerza orbital
      let tangent = createVector(-toCenter.y, toCenter.x);
      tangent.normalize();
      tangent.mult(2);

      // Fuerza centrípeta para mantener distancia
      if (d > 200) {
        toCenter.setMag(0.5);
        agent.vel.add(toCenter);
      } else if (d < 150) {
        toCenter.setMag(-0.5);
        agent.vel.add(toCenter);
      }

      agent.vel.add(tangent);
      agent.vel.mult(0.98);

      // Cambiar color a transmutado
      agent.color = color(100, 200, 255);
    }
  }

  transmuteAgent(agent) {
    // Efecto visual de transmutación
    agent.color = color(100, 200, 255);
    agent.size = agent.size * 1.2;

    // Crear partículas de transmutación
    for (let i = 0; i < 10; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 5);
      this.pulses.push({
        pos: agent.pos.copy(),
        radius: 0,
        alpha: 150,
        power: 0.5,
        isParticle: true,
        vel: createVector(cos(angle) * speed, sin(angle) * speed)
      });
    }
  }

  draw() {
    if (!this.active) return;

    push();

    // Dibujar pulsos expansivos
    for (let pulse of this.pulses) {
      if (pulse.isParticle) {
        // Partículas de transmutación
        stroke(100, 200, 255, pulse.alpha);
        strokeWeight(3);
        point(pulse.pos.x, pulse.pos.y);
      } else {
        // Ondas de pulso
        noFill();
        stroke(100, 200, 255, pulse.alpha * pulse.power);
        strokeWeight(2 + pulse.power * 2);
        circle(pulse.pos.x, pulse.pos.y, pulse.radius * 2);

        // Anillo interior del pulso
        stroke(150, 220, 255, pulse.alpha * 0.5);
        strokeWeight(1);
        circle(pulse.pos.x, pulse.pos.y, pulse.radius * 1.8);
      }
    }

    // Núcleo central
    translate(this.position.x, this.position.y);

    // Anillos energéticos giratorios
    for (let ring of this.energyRings) {
      noFill();
      stroke(100, 200, 255, 100);
      strokeWeight(1);

      beginShape();
      for (let a = 0; a < TWO_PI; a += 0.1) {
        let r = ring.radius + sin(a * 3 + ring.phase) * 10;
        let x = cos(a) * r;
        let y = sin(a) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    }

    // Núcleo brillante
    for (let i = 3; i > 0; i--) {
      fill(100, 200, 255, 100 / i);
      noStroke();
      circle(0, 0, 40 * i);
    }

    // Centro pulsante
    let pulseSize = 20 + sin(frameCount * 0.1) * 5;
    fill(200, 240, 255);
    noStroke();
    circle(0, 0, pulseSize);

    // Rayos de energía
    stroke(100, 200, 255, 150);
    strokeWeight(2);
    for (let i = 0; i < 6; i++) {
      let angle = frameCount * 0.03 + i * TWO_PI / 6;
      let len = 30 + sin(frameCount * 0.05 + i) * 10;
      line(0, 0, cos(angle) * len, sin(angle) * len);
    }

    pop();

    // Conectar agentes transmutados al núcleo
    stroke(100, 200, 255, 50);
    strokeWeight(0.5);
    for (let agent of this.convertedAgents) {
      if (agent.active) {
        line(this.position.x, this.position.y, agent.pos.x, agent.pos.y);
      }
    }

    // Texto informativo
    fill(100, 200, 255);
    noStroke();
    textAlign(CENTER);
    text(`NUCLEO MODE: ${this.transmutedCount} AGENTES TRANSMUTADOS`, width/2, 30);
    text(`CONVERSIÓN: ${int((this.transmutedCount / 100) * 100)}%`, width/2, 50);
  }

  isComplete(agents) {
    // El final se completa cuando todos los agentes están transmutados
    let activeAgents = agents.filter(a => a.active);
    return activeAgents.length > 0 && activeAgents.every(a => this.convertedAgents.has(a));
  }
}
