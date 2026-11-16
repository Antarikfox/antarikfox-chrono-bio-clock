const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(new URL('../src/clock.js',`file://${__filename}`),'utf8');
function fixture(iso='2026-11-16T20:30:00Z'){
  class Element {
    constructor(){this.style={};this.children=[];this.attrs={};this.isConnected=true;this.events=[];this.classList={toggle:(name,value)=>this[name]=value};}
    attachShadow(){return this.shadowRoot=new Element();}
    set innerHTML(value){this.html=value;this.nodes={};}
    querySelector(selector){return this.nodes[selector]??=new Element();}
    setAttribute(key,value){this.attrs[key]=value;}
    append(value){this.children.push(value);}
    replaceChildren(){this.children=[];}
    addEventListener(name,handler){this.events.push({name,handler});}
    dispatchEvent(event){this.events.push(event);}
  }
  const registry={},timers=new Set();let counter=0,current=iso;
  class ClockDate extends Date {constructor(...args){super(...(args.length?args:[current]));}}
  const context={HTMLElement:Element,Date:ClockDate,Intl,document:{createElement:()=>new Element(),createElementNS:()=>new Element()},customElements:{get:name=>registry[name],define:(name,type)=>registry[name]=type},window:{customCards:[],dispatchEvent(){}},history:{pushState(){}},Event:class{},CustomEvent:class {constructor(type,options){this.type=type;Object.assign(this,options);}},setInterval:()=>{timers.add(++counter);return counter;},clearInterval:id=>timers.delete(id),setTimeout:()=>++counter,clearTimeout(){}};
  vm.runInNewContext(source,context);
  const card=new registry['antarikfox-chrono-bio-clock']();
  card.setConfig({});
  return {card,registry,timers,setTime:value=>current=value};
}
test('correct local time and date across midnight',()=>{
  const {card,setTime}=fixture();const q=s=>card.shadowRoot.querySelector(s);
  assert.equal(q('.digits').attrs['aria-label'],'23:30:00');
  assert.match(q('.date span').textContent,/16/);
  setTime('2026-11-16T21:05:08Z');card.tick();
  assert.equal(q('.digits').attrs['aria-label'],'00:05:08');
  assert.match(q('.date span').textContent,/17/);
});
test('automatic night interval crosses midnight and ends at boundary',()=>{
  const {card,setTime}=fixture();card.setConfig({auto_night:true});
  assert.equal(card.shadowRoot.querySelector('.case').night,true);
  setTime('2026-11-17T04:00:00Z');card.tick();
  assert.equal(card.shadowRoot.querySelector('.case').night,false);
});
test('language follows HA or explicit override; source does not mutate entities',()=>{
  const {card}=fixture();card.hass={language:'ru'};
  assert.equal(card.shadowRoot.querySelector('.gear').title,'Настройки');
  card.setConfig({language:'en',alarm_entity:'input_boolean.alarm'});
  assert.equal(card.shadowRoot.querySelector('.gear').title,'Settings');
  card.shadowRoot.querySelector('.alarm').onclick();
  assert.equal(card.events.at(-1).type,'hass-more-info');
  assert.equal(card.events.at(-1).detail.entityId,'input_boolean.alarm');
});
test('brightness controls clamp and do not reveal old date artwork',()=>{
  const {card}=fixture();for(let i=0;i<30;i++)card.shadowRoot.querySelector('.minus').onclick();
  assert.equal(card.level,.2);
  assert.equal(card.shadowRoot.querySelector('.date').style.opacity,undefined);
  for(let i=0;i<30;i++)card.shadowRoot.querySelector('.plus').onclick();
  assert.equal(card.level,1);
});
test('seconds can be removed; rerender creates only one timer; detach stops it',()=>{
  const {card,timers}=fixture();assert.equal(card.shadowRoot.querySelector('.digits').children.length,8);
  card.setConfig({show_seconds:false});assert.equal(card.shadowRoot.querySelector('.digits').children.length,6);
  assert.equal(timers.size,1);card.disconnectedCallback();assert.equal(timers.size,0);
});
test('invalid configuration fails before timer render',()=>{
  const {card}=fixture();assert.throws(()=>card.setConfig({timezone:'Invalid/Timezone'}));
  assert.throws(()=>card.setConfig({night_start:25}));assert.throws(()=>card.setConfig({night_end:2.5}));
});
test('all seven segments share one shear and symmetric base grid',()=>{
  const paths=JSON.parse(source.match(/const shapes=(\[.*?\]);/)[1]);
  const unshear=path=>path.split(' ').map(point=>{const [x,y]=point.split(',').map(Number);return [+(x-.18*(208-y)).toFixed(2),y];});
  const a=unshear(paths[0]),d=unshear(paths[3]);
  assert.equal(Math.max(...a.map(p=>p[1]))-Math.min(...a.map(p=>p[1])),24);
  assert.equal(Math.max(...d.map(p=>p[1]))-Math.min(...d.map(p=>p[1])),24);
  const left=unshear(paths[5]),right=unshear(paths[1]);
  assert.deepEqual(left.map(([x,y])=>[140-x,y]),right);
});