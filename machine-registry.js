window.ChappikoRegistry = (() => {
  const machines = new Map();
  function register(def){
    if(!def || !def.id) throw new Error("machine definition requires id");
    machines.set(def.id, Object.freeze(def));
  }
  function get(id){ return machines.get(id) || null; }
  function all(){ return [...machines.values()]; }
  return { register, get, all };
})();
