// Tetramero - Sistema de 4 núcleos con absorción y fisión nuclear
class Tetramero {
  constructor() {
    this.active = false;
    this.cores = [];
    this.absorptionRadius = 80;
    this.fusionLinks = [];
    this.absorbedEnergy = 0;
    this.criticalMass = 50;
    this.fissionParticles = [];
    this.chainReactions = 0;
  }

  activate() {
    this.active = true;
    this.absorbedEnergy = 0;

    // Crear 4 núcleos en formación tetraédrica (vista 2D)
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = 150;

    for (let i = 0; i < 4; i++) {
      let angle = (TWO_PI / 4) * i + QUARTER_PI;
      this.cores.push({
        pos: createVector(
          centerX + cos(angle) * radius,
          centerY + sin(angle) * radius
        ),
        energy: 0,
        maxEnergy: 20,
        radius: 30,
        pulsePhase: random(TWO_PI),
        absorbedAgents: []
      });
    }
  }

  update(agents) {
    if (!this.active) return;

    // Actualizar cada núcleo
    for (let core of this.cores) {
      core.pulsePhase += 0.05;

      // Absorber agentes cercanos
      for (let agent of agents) {
        if (!agent.active) continue;

        let d = p5.Vector.dist(core.pos, agent.pos);

        // Atracción gravitacional
        if (d < 200) {
          let force = p5.Vector.sub(core.pos, agent.pos);
          force.setMag(0.5 / (d * 0.1));
          agent.vel.add(force);
        }

        // Absorber si está dentro del radio
        if (d < this.absorptionRadius) {
          agent.active = false;
          core.energy++;
          core.absorbedAgents.push(agent);
          this.absorbedEnergy++;

          // Efecto visual de absorción
          for (let i = 0; i < 5; i++) {
            this.fissionParticles.push({
              pos: agent.pos.copy(),
              vel: p5.Vector.random2D().mult(random(0.5, 2)),
              life: 255,
              color: color(255, random(100, 200), 0)
            });
          }

          // Verificar fisión
          if (core.energy >= core.maxEnergy) {
            this.triggerFission(core);
          }
        }
      }
    }

    // Enlaces de fusión entre núcleos
    this.fusionLinks = [];
    for (let i = 0; i < this.cores.length; i++) {
      for (let j = i + 1; j < this.cores.length; j++) {
        let energySum = this.cores[i].energy + this.cores[j].energy;
        if (energySum > 10) {
          this.fusionLinks.push({
            from: this.cores[i],
            to: this.cores[j],
            strength: energySum / 40
          });
        }
      }
    }

    // Actualizar partículas de fisión
    for (let i = this.fissionParticles.length - 1; i >= 0; i--) {
      let p = this.fissionParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.97);
      p.life -= 3;

      if (p.life <= 0) {
        this.fissionParticles.splice(i, 1);
      }
    }

    // Rotación del sistema completo
    let center = createVector(width / 2, height / 2);
    for (let core of this.cores) {
      let toCenter = p5.Vector.sub(core.pos, center);
      toCenter.rotate(0.002);
      core.pos = p5.Vector.add(center, toCenter);
    }
  }

  triggerFission(core) {
    this.chainReactions++;

    // Liberar energía en forma de partículas
    let particleCount = int(core.energy * 2);
    for (let i = 0; i < particleCount; i++) {
      let angle = (TWO_PI / particleCount) * i;
      let speed = random(3, 6);

      this.fissionParticles.push({
        pos: core.pos.copy(),
        vel: createVector(cos(angle) * speed, sin(angle) * speed),
        life: 255,
        color: color(255, random(150, 255), 0),
        isFission: true
      });
    }

    // Crear onda expansiva
    for (let i = 0; i < 3; i++) {
      this.fissionParticles.push({
        pos: core.pos.copy(),
        vel: createVector(0, 0),
        life: 150,
        isWave: true,
        waveRadius: 0,
        waveSpeed: 5 + i * 2,
        color: color(255, 200, 0, 150)
      });
    }

    // Redistribuir energía a otros núcleos
    let redistribution = core.energy / this.cores.length;
    for (let other of this.cores) {
      if (other !== core) {
        other.energy += redistribution * 0.3;
      }
    }

    // Resetear núcleo
    core.energy = 0;
  }

  draw() {
    if (!this.active) return;

    push();

    // Dibujar partículas de fisión
    for (let p of this.fissionParticles) {
      if (p.isWave) {
        // Ondas expansivas
        noFill();
        stroke(red(p.color), green(p.color), blue(p.color), p.life);
        strokeWeight(2);
        circle(p.pos.x, p.pos.y, p.waveRadius * 2);
        p.waveRadius += p.waveSpeed;
      } else {
        // Partículas energéticas
        fill(red(p.color), green(p.color), blue(p.color), p.life);
        noStroke();
        circle(p.pos.x, p.pos.y, p.isFission ? 4 : 2);

        // Estela
        if (p.isFission) {
          stroke(red(p.color), green(p.color), blue(p.color), p.life * 0.3);
          strokeWeight(1);
          let trail = p5.Vector.sub(p.pos, p.vel);
          line(p.pos.x, p.pos.y, trail.x, trail.y);
        }
      }
    }

    // Dibujar enlaces de fusión
    for (let link of this.fusionLinks) {
      let alpha = link.strength * 150;

      // Rayo de energía pulsante
      for (let i = 0; i < 3; i++) {
        stroke(255, 150 + i * 30, 0, alpha / (i + 1));
        strokeWeight(3 - i);

        let offset = sin(frameCount * 0.1 + i) * 5;
        let from = link.from.pos.copy();
        let to = link.to.pos.copy();

        // Añadir ondulación al rayo
        let mid = p5.Vector.lerp(from, to, 0.5);
        let perpendicular = createVector(-(to.y - from.y), to.x - from.x);
        perpendicular.setMag(offset);
        mid.add(perpendicular);

        noFill();
        beginShape();
        vertex(from.x, from.y);
        quadraticVertex(mid.x, mid.y, to.x, to.y);
        endShape();
      }
    }

    // Dibujar núcleos
    for (let core of this.cores) {
      push();
      translate(core.pos.x, core.pos.y);

      // Anillos de energía según nivel
      let energyRatio = core.energy / core.maxEnergy;

      for (let i = 3; i > 0; i--) {
        let ringSize = core.radius * (1 + i * 0.3);
        let ringAlpha = energyRatio * 100 / i;

        fill(255, 150, 0, ringAlpha);
        noStroke();
        circle(0, 0, ringSize * 2);
      }

      // Núcleo central pulsante
      let pulseSize = core.radius + sin(core.pulsePhase) * 5;
      fill(255, 200 - energyRatio * 100, 0);
      noStroke();
      circle(0, 0, pulseSize);

      // Corona de fisión si está cerca del máximo
      if (energyRatio > 0.7) {
        stroke(255, 100, 0, 200);
        strokeWeight(2);
        noFill();

        for (let i = 0; i < 8; i++) {
          let angle = frameCount * 0.05 + i * TWO_PI / 8;
          let len = pulseSize + 10;
          let x = cos(angle) * len;
          let y = sin(angle) * len;
          line(0, 0, x, y);
        }
      }

      // Indicador de energía
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text(int(core.energy), 0, 0);

      pop();
    }

    pop();

    // Texto informativo
    fill(255, 150, 0);
    noStroke();
    textAlign(CENTER);
    textSize(14);
    text(`TETRAMERO MODE: ${this.absorbedEnergy} ABSORCIONES`, width/2, 30);
    text(`REACCIONES EN CADENA: ${this.chainReactions}`, width/2, 50);

    // Barra de criticidad total
    let totalEnergy = this.cores.reduce((sum, c) => sum + c.energy, 0);
    let maxTotalEnergy = this.cores.length * this.cores[0].maxEnergy;
    let criticalityRatio = totalEnergy / maxTotalEnergy;

    fill(255, 150, 0, 100);
    noStroke();
    rect(width/2 - 100, 70, 200, 10);

    fill(255, 200 - criticalityRatio * 100, 0);
    rect(width/2 - 100, 70, 200 * criticalityRatio, 10);

    fill(255);
    textSize(10);
    text(`CRITICIDAD: ${int(criticalityRatio * 100)}%`, width/2, 65);
  }

  isComplete(agents) {
    // El final se completa cuando se han absorbido suficientes agentes
    // y ha habido múltiples reacciones en cadena
    return this.absorbedEnergy >= this.criticalMass && this.chainReactions >= 5;
  }
}
