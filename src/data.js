export const CARS = [
{id:'vortex',name:'Vortex GT',class:'D',price:0,color:0x19c9ff,top:50,accel:27,handling:1.50,nitro:1.00,style:'gt'},
{id:'comet',name:'Comet RS',class:'D',price:2400,color:0xffbc32,top:52,accel:28,handling:1.46,nitro:1.02,style:'coupe'},
{id:'raijin',name:'Raijin R',class:'C',price:4800,color:0xff3f72,top:54,accel:29.5,handling:1.40,nitro:1.06,style:'muscle'},
{id:'falcon',name:'Falcon X',class:'C',price:7200,color:0x62ef80,top:55.5,accel:30,handling:1.37,nitro:1.08,style:'roadster'},
{id:'spectre',name:'Spectre X',class:'B',price:10500,color:0xa777ff,top:58,accel:31.5,handling:1.33,nitro:1.12,style:'supercar'},
{id:'tempest',name:'Tempest V12',class:'B',price:13800,color:0xff7138,top:59,accel:32,handling:1.31,nitro:1.14,style:'track'},
{id:'phantom',name:'Phantom R',class:'A',price:18500,color:0xe8edf8,top:61,accel:33.5,handling:1.28,nitro:1.17,style:'luxury'},
{id:'apex',name:'Apex One',class:'A',price:23500,color:0x28e6d3,top:62.5,accel:34.5,handling:1.25,nitro:1.19,style:'ev'},
{id:'nova',name:'Nova Hyper',class:'S',price:32000,color:0xff2c49,top:65,accel:36,handling:1.23,nitro:1.22,style:'hyper'},
{id:'zenith',name:'Zenith X',class:'S',price:42000,color:0x7a8cff,top:68,accel:37.5,handling:1.20,nitro:1.26,style:'prototype'},
{id:'eclipse',name:'Eclipse R',class:'S+',price:56000,color:0xf232d5,top:71,accel:39,handling:1.18,nitro:1.30,style:'hyper'},
{id:'legend',name:'Legend One',class:'S+',price:75000,color:0xffd23f,top:74,accel:41,handling:1.16,nitro:1.35,style:'legend'}
];

export const TRACKS = {
coast:{name:'Azure Coast',sky:0x74c7ff,fog:0xa8dcff,ground:0x4a883d,accent:0x00d8ff,shape:'oval',weather:'clear'},
harbor:{name:'Steel Harbor',sky:0x9ec4d5,fog:0xb9d0da,ground:0x536067,accent:0xffb32d,shape:'kidney',weather:'cloudy'},
desert:{name:'Red Canyon',sky:0xffb36a,fog:0xeab77d,ground:0xa96836,accent:0xff5e2c,shape:'wide',weather:'dust'},
night:{name:'Neon City',sky:0x050916,fog:0x091228,ground:0x151b22,accent:0xb74dff,shape:'city',weather:'night'},
alpine:{name:'Alpine Rush',sky:0x789bb4,fog:0xa6bcc8,ground:0x60746a,accent:0x39d9ff,shape:'figure8',weather:'snow'},
storm:{name:'Thunder Run',sky:0x121924,fog:0x263140,ground:0x26352d,accent:0x48d4ff,shape:'kidney',weather:'rain'},
practice:{name:'Endless Practice',sky:0x8fd2ff,fog:0xb8def0,ground:0x47733f,accent:0x54f6c7,shape:'practice',weather:'clear',practice:true}
};

export const EVENTS = [
{id:'e01',chapter:1,name:'First Ignition',track:'coast',mode:'Classic',laps:2,ai:5,reward:1500,recommended:0},
{id:'e02',chapter:1,name:'Coastal Rush',track:'coast',mode:'Time Attack',laps:2,ai:3,reward:1900,target:128000,recommended:0},
{id:'e03',chapter:1,name:'Harbor Clash',track:'harbor',mode:'Classic',laps:3,ai:5,reward:2300,recommended:1},
{id:'e04',chapter:1,name:'Last Car Standing',track:'harbor',mode:'Knockout',laps:4,ai:5,reward:2800,recommended:1},
{id:'e05',chapter:2,name:'Canyon Heat',track:'desert',mode:'Classic',laps:3,ai:6,reward:3400,recommended:2},
{id:'e06',chapter:2,name:'Dust Sprint',track:'desert',mode:'Time Attack',laps:2,ai:4,reward:3800,target:148000,recommended:2},
{id:'e07',chapter:2,name:'Neon Pursuit',track:'night',mode:'Classic',laps:3,ai:6,reward:4400,recommended:3},
{id:'e08',chapter:2,name:'Midnight Knockout',track:'night',mode:'Knockout',laps:5,ai:7,reward:5000,recommended:3},
{id:'e09',chapter:3,name:'Alpine Attack',track:'alpine',mode:'Classic',laps:3,ai:7,reward:5600,recommended:4},
{id:'e10',chapter:3,name:'Frozen Clock',track:'alpine',mode:'Time Attack',laps:3,ai:5,reward:6100,target:205000,recommended:4},
{id:'e11',chapter:3,name:'Storm Front',track:'storm',mode:'Classic',laps:4,ai:7,reward:7000,recommended:5},
{id:'e12',chapter:3,name:'Thunder Elimination',track:'storm',mode:'Knockout',laps:5,ai:7,reward:7800,recommended:5},
{id:'e13',chapter:4,name:'Legends Tour',track:'coast',mode:'Classic',laps:4,ai:8,reward:9000,recommended:7},
{id:'e14',chapter:4,name:'Hyper Sprint',track:'night',mode:'Time Attack',laps:3,ai:6,reward:10500,target:190000,recommended:8},
{id:'e15',chapter:4,name:'Final Ascension',track:'storm',mode:'Knockout',laps:6,ai:9,reward:15000,recommended:10}
];

export const ACHIEVEMENTS = [
{id:'firstwin',name:'First Victory',desc:'Win your first career event',reward:500},
{id:'collector',name:'Collector',desc:'Own 4 cars',reward:1200},
{id:'speed250',name:'Velocity 250',desc:'Reach 250 km/h',reward:800},
{id:'drifter',name:'Drift King',desc:'Build a drift combo of x5',reward:1000},
{id:'career5',name:'Rising Star',desc:'Clear 5 career events',reward:1800},
{id:'career15',name:'Velocity Legend',desc:'Clear the full career',reward:8000}
];

export const UPGRADE_KEYS=['engine','handling','nitro'];
export function upgradeCost(level){return 700+level*650;}
