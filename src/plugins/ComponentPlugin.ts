import type { IPlugin, IEngine, GameState, GameEvent, ComponentDef } from '../engine/types';
import type { GoldPlugin } from './GoldPlugin';
import type { EnemyPlugin } from './EnemyPlugin';

const INITIAL_COMPONENTS: ComponentDef[] = [
  {
    id: 'gpu',
    name: 'GPU_UNIT',
    description: 'Parallel damage processor',
    baseDps: 0.5,
    baseCost: 10,
    costMultiplier: 1.15,
    level: 0,
    unlocked: true,
    color: 'cyan',
  },
  {
    id: 'ram',
    name: 'RAM_BANK',
    description: 'Buffer overflow exploit',
    baseDps: 2,
    baseCost: 100,
    costMultiplier: 1.18,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'cpu_cooler',
    name: 'CPU_COOLER',
    description: 'Thermal attack array',
    baseDps: 8,
    baseCost: 1000,
    costMultiplier: 1.20,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'ssd',
    name: 'SSD_DRIVE',
    description: 'High-speed data injection',
    baseDps: 40,
    baseCost: 10000,
    costMultiplier: 1.22,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'psu',
    name: 'PSU_CORE',
    description: 'Power surge devastator',
    baseDps: 200,
    baseCost: 100000,
    costMultiplier: 1.25,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'liquid_cool',
    name: 'LIQUID_COOL',
    description: 'Thermal dissipation overcharge',
    baseDps: 1200,
    baseCost: 1000000,
    costMultiplier: 1.28,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'fpga',
    name: 'FPGA_ARRAY',
    description: 'Reconfigurable logic attack grid',
    baseDps: 8000,
    baseCost: 10000000,
    costMultiplier: 1.30,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'tensor',
    name: 'TENSOR_CORE',
    description: 'Neural matrix decimator',
    baseDps: 60000,
    baseCost: 100000000,
    costMultiplier: 1.32,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'quantum',
    name: 'QUANTUM_BIT',
    description: 'Superposition damage state',
    baseDps: 500000,
    baseCost: 1000000000,
    costMultiplier: 1.35,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'singularity',
    name: 'SINGULARITY_ENGINE',
    description: 'The end of all computation',
    baseDps: 5000000,
    baseCost: 10000000000,
    costMultiplier: 1.38,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'darknet',
    name: 'DARKNET_NODE',
    description: 'Hidden relay packet flood',
    baseDps: 40000000,
    baseCost: 100000000000,
    costMultiplier: 1.38,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'bytestorm',
    name: 'BYTESTORM_GEN',
    description: 'Recursive payload detonator',
    baseDps: 300000000,
    baseCost: 1000000000000,
    costMultiplier: 1.39,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'exploit_kit',
    name: 'EXPLOIT_KIT',
    description: 'Zero-day vulnerability swarm',
    baseDps: 2500000000,
    baseCost: 10000000000000,
    costMultiplier: 1.39,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'rootkit',
    name: 'ROOTKIT_OMEGA',
    description: 'Deep kernel privilege escalation',
    baseDps: 20000000000,
    baseCost: 100000000000000,
    costMultiplier: 1.40,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'botnet',
    name: 'BOTNET_SWARM',
    description: 'Distributed DDoS annihilator',
    baseDps: 160000000000,
    baseCost: 1000000000000000,
    costMultiplier: 1.40,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'cipher_engine',
    name: 'CIPHER_ENGINE',
    description: 'Cryptographic brute force array',
    baseDps: 1300000000000,
    baseCost: 10000000000000000,
    costMultiplier: 1.41,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'memcrash',
    name: 'MEMCRASH_UNIT',
    description: 'Heap fragmentation disruptor',
    baseDps: 10000000000000,
    baseCost: 100000000000000000,
    costMultiplier: 1.41,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'proxy_chain',
    name: 'PROXY_CHAIN',
    description: 'Layered anonymity strike vector',
    baseDps: 80000000000000,
    baseCost: 1000000000000000000,
    costMultiplier: 1.42,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'neural_hack',
    name: 'NEURAL_HACK',
    description: 'Synthetic synapse override',
    baseDps: 650000000000000,
    baseCost: 10000000000000000000,
    costMultiplier: 1.42,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'data_leech',
    name: 'DATA_LEECH',
    description: 'Exfiltration pipeline maximizer',
    baseDps: 5000000000000000,
    baseCost: 100000000000000000000,
    costMultiplier: 1.42,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'vortex_node',
    name: 'VORTEX_NODE',
    description: 'Traffic singularity collapse',
    baseDps: 40000000000000000,
    baseCost: 1000000000000000000000,
    costMultiplier: 1.43,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'pulse_bomb',
    name: 'PULSE_BOMB',
    description: 'Electromagnetic burst disabler',
    baseDps: 320000000000000000,
    baseCost: 10000000000000000000000,
    costMultiplier: 1.43,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'ghost_proc',
    name: 'GHOST_PROC',
    description: 'Invisible process execution fork',
    baseDps: 2500000000000000000,
    baseCost: 100000000000000000000000,
    costMultiplier: 1.43,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'syscall_storm',
    name: 'SYSCALL_STORM',
    description: 'Kernel interrupt cascade flood',
    baseDps: 20000000000000000000,
    baseCost: 1000000000000000000000000,
    costMultiplier: 1.44,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'entropy_sink',
    name: 'ENTROPY_SINK',
    description: 'Randomness harvester weapon',
    baseDps: 160000000000000000000,
    baseCost: 10000000000000000000000000,
    costMultiplier: 1.44,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'parity_blitz',
    name: 'PARITY_BLITZ',
    description: 'Error correction obliterator',
    baseDps: 1300000000000000000000,
    baseCost: 100000000000000000000000000,
    costMultiplier: 1.44,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'null_pointer',
    name: 'NULL_POINTER',
    description: 'Dereferenced void strike',
    baseDps: 10000000000000000000000,
    baseCost: 1000000000000000000000000000,
    costMultiplier: 1.45,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'stack_overflow',
    name: 'STACK_OVERFLOW',
    description: 'Recursive crash amplifier',
    baseDps: 80000000000000000000000,
    baseCost: 10000000000000000000000000000,
    costMultiplier: 1.45,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'cryptoworm',
    name: 'CRYPTOWORM',
    description: 'Self-replicating ransom payload',
    baseDps: 650000000000000000000000,
    baseCost: 100000000000000000000000000000,
    costMultiplier: 1.45,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'hashcracker',
    name: 'HASHCRACKER',
    description: 'Rainbow table obliteration rig',
    baseDps: 5000000000000000000000000,
    baseCost: 1000000000000000000000000000000,
    costMultiplier: 1.45,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'spinlock',
    name: 'SPINLOCK_MAZE',
    description: 'CPU starvation loop generator',
    baseDps: 40000000000000000000000000,
    baseCost: 10000000000000000000000000000000,
    costMultiplier: 1.46,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'firmware_burn',
    name: 'FIRMWARE_BURN',
    description: 'Persistent flash memory corruptor',
    baseDps: 320000000000000000000000000,
    baseCost: 100000000000000000000000000000000,
    costMultiplier: 1.46,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'sector_wipe',
    name: 'SECTOR_WIPE',
    description: 'Block device annihilation pulse',
    baseDps: 2500000000000000000000000000,
    baseCost: 1000000000000000000000000000000000,
    costMultiplier: 1.46,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'signal_jammer',
    name: 'SIGNAL_JAMMER',
    description: 'Frequency disruption emitter',
    baseDps: 20000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000,
    costMultiplier: 1.46,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'arp_spoof',
    name: 'ARP_SPOOF',
    description: 'Network identity forger',
    baseDps: 160000000000000000000000000000,
    baseCost: 100000000000000000000000000000000000,
    costMultiplier: 1.47,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'photon_lance',
    name: 'PHOTON_LANCE',
    description: 'Light-speed intrusion beam',
    baseDps: 1300000000000000000000000000000,
    baseCost: 1000000000000000000000000000000000000,
    costMultiplier: 1.47,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'daemon_forge',
    name: 'DAEMON_FORGE',
    description: 'Background process weaponizer',
    baseDps: 10000000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000000,
    costMultiplier: 1.47,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'ion_disruptor',
    name: 'ION_DISRUPTOR',
    description: 'Charged particle data erasure',
    baseDps: 80000000000000000000000000000000,
    baseCost: 100000000000000000000000000000000000000,
    costMultiplier: 1.47,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'void_compiler',
    name: 'VOID_COMPILER',
    description: 'Undefined behavior exploit engine',
    baseDps: 650000000000000000000000000000000,
    baseCost: 1000000000000000000000000000000000000000,
    costMultiplier: 1.48,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'plasma_inject',
    name: 'PLASMA_INJECT',
    description: 'High-energy SQL vaporizer',
    baseDps: 5000000000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000000000,
    costMultiplier: 1.48,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'warp_thread',
    name: 'WARP_THREAD',
    description: 'Spacetime branch predictor break',
    baseDps: 40000000000000000000000000000000000,
    baseCost: 100000000000000000000000000000000000000000,
    costMultiplier: 1.48,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'omega_shell',
    name: 'OMEGA_SHELL',
    description: 'Final-tier remote code executor',
    baseDps: 320000000000000000000000000000000000,
    baseCost: 1000000000000000000000000000000000000000000,
    costMultiplier: 1.48,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'event_horizon',
    name: 'EVENT_HORIZON',
    description: 'No data escapes this attack',
    baseDps: 2500000000000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000000000000,
    costMultiplier: 1.49,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'supernova_burst',
    name: 'SUPERNOVA_BURST',
    description: 'Stellar collapse damage wave',
    baseDps: 20000000000000000000000000000000000000,
    baseCost: 100000000000000000000000000000000000000000000,
    costMultiplier: 1.49,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'pulsar_array',
    name: 'PULSAR_ARRAY',
    description: 'Periodic high-energy pulse emitter',
    baseDps: 160000000000000000000000000000000000000,
    baseCost: 1000000000000000000000000000000000000000000000,
    costMultiplier: 1.49,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
  {
    id: 'dark_matter',
    name: 'DARK_MATTER_RIG',
    description: 'Invisible mass collision driver',
    baseDps: 1300000000000000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000000000000000,
    costMultiplier: 1.49,
    level: 0,
    unlocked: false,
    color: 'green',
  },
  {
    id: 'neutrino_cannon',
    name: 'NEUTRINO_CANNON',
    description: 'Unstoppable particle penetration',
    baseDps: 10000000000000000000000000000000000000000,
    baseCost: 100000000000000000000000000000000000000000000000,
    costMultiplier: 1.50,
    level: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'omnivirus',
    name: 'OMNIVIRUS',
    description: 'All-platform total system erasure',
    baseDps: 80000000000000000000000000000000000000000,
    baseCost: 1000000000000000000000000000000000000000000000000,
    costMultiplier: 1.50,
    level: 0,
    unlocked: false,
    color: 'pink',
  },
  {
    id: 'godmode',
    name: 'GODMODE_KERNEL',
    description: 'Absolute privilege. No rules apply.',
    baseDps: 650000000000000000000000000000000000000000,
    baseCost: 10000000000000000000000000000000000000000000000000,
    costMultiplier: 1.50,
    level: 0,
    unlocked: false,
    color: 'cyan',
  },
];

export function getComponentCost(comp: ComponentDef): number {
  return Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level));
}

export function getComponentBulkCost(comp: ComponentDef, quantity: number): number {
  let total = 0;
  for (let i = 0; i < quantity; i++) {
    total += Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level + i));
  }
  return total;
}

export function getComponentDps(comp: ComponentDef): number {
  if (comp.level === 0) return 0;
  return comp.baseDps * comp.level;
}

export function getTotalIdleDps(components: Record<string, ComponentDef>): number {
  return Object.values(components).reduce((sum, c) => sum + getComponentDps(c), 0);
}

export class ComponentPlugin implements IPlugin {
  id = 'component';
  dependencies = ['gold', 'enemy'];
  stateKeys = ['components'] as (keyof GameState)[];

  private engine!: IEngine;
  private idleDamageAccum = 0;

  get defaultState() {
    const initialMap: Record<string, ComponentDef> = {};
    for (const c of INITIAL_COMPONENTS) {
      initialMap[c.id] = { ...c };
    }
    return { components: initialMap };
  }

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.on('state_sync', (event: GameEvent<{ savedState: GameState } | null>) => {
      if (event.payload?.savedState?.components) {
        const saved = event.payload.savedState.components;
        const merged: Record<string, ComponentDef> = {};
        for (const c of INITIAL_COMPONENTS) {
          merged[c.id] = saved[c.id] ? { ...c, ...saved[c.id] } : { ...c };
        }
        engine.updateState({ components: merged });
      }
    });

    engine.on('overclock', () => {
      const current = this.engine.state.components;
      const reset: Record<string, ComponentDef> = {};
      for (const c of INITIAL_COMPONENTS) {
        // Preserve unlocked state for components beyond the 5th (endgame unlocks persist)
        const wasUnlocked = current[c.id]?.unlocked ?? c.unlocked;
        reset[c.id] = { ...c, unlocked: wasUnlocked };
      }
      engine.updateState({ components: reset });
    });
  }

  getMaxAffordable(componentId: string): number {
    const comp = this.engine.state.components[componentId];
    if (!comp) return 0;
    const gold = this.engine.state.gold;
    let qty = 0;
    let spent = 0;
    while (true) {
      const next = Math.floor(comp.baseCost * Math.pow(comp.costMultiplier, comp.level + qty));
      if (spent + next > gold) break;
      spent += next;
      qty++;
    }
    return qty;
  }

  purchase(componentId: string): boolean {
    return this.purchaseBulk(componentId, 1);
  }

  purchaseBulk(componentId: string, quantity: number): boolean {
    if (quantity <= 0) return false;
    const state = this.engine.state;
    const comp = state.components[componentId];
    if (!comp) return false;

    const totalCost = getComponentBulkCost(comp, quantity);
    const goldPlugin = this.engine.getPlugin<GoldPlugin>('gold');
    if (!goldPlugin?.spend(totalCost)) return false;

    const newLevel = comp.level + quantity;
    const updatedComp = { ...comp, level: newLevel };

    const idx = INITIAL_COMPONENTS.findIndex(c => c.id === componentId);
    const nextComp = INITIAL_COMPONENTS[idx + 1];

    const updatedComponents = { ...state.components, [componentId]: updatedComp };
    if (nextComp && !state.components[nextComp.id]?.unlocked) {
      updatedComponents[nextComp.id] = { ...state.components[nextComp.id], unlocked: true };
    }

    this.engine.updateState({ components: updatedComponents });
    this.engine.emit('component_levelup', { componentId, level: newLevel, cost: totalCost });
    return true;
  }

  onTick(delta: number, state: GameState): void {
    if (!state.enemy || state.enemy.hp <= 0) return;

    const idleDps = getTotalIdleDps(state.components) * this.engine.getModifier('idle_dps');
    if (idleDps <= 0) return;

    this.idleDamageAccum += idleDps * delta;

    if (this.idleDamageAccum >= 1) {
      const dmg = Math.floor(this.idleDamageAccum);
      this.idleDamageAccum -= dmg;

      const enemyPlugin = this.engine.getPlugin<EnemyPlugin>('enemy');
      enemyPlugin?.applyDamage(dmg);

      const dmgEvent = {
        id: `idle_${Date.now()}`,
        value: dmg,
        type: 'idle' as const,
      };
      this.engine.emit('damage_number', dmgEvent);
    }
  }
}
