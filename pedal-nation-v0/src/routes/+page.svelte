<script lang="ts">
  import { onMount } from 'svelte';
  import { loadPedals, loadBoards, pedalImageUrl, boardImageUrl, inToPixels, type PPPedal, type PPBoard } from '$lib/data/pedals';
  import { getAffiliateLinks } from '$lib/data/affiliates';

  let pedals = $state<PPPedal[]>([]);
  let boards = $state<PPBoard[]>([]);
  let scale = $state(40);
  let canvasItems = $state<CanvasItem[]>([]);
  let selectedId = $state<string | null>(null);
  let nextId = $state(1);
  let dragging = $state<{id:string;ox:number;oy:number}|null>(null);
  let canvasEl: HTMLDivElement;
  let showTop = $state(true);
  let showBottom = $state(true);
  let tab = $state<'pedals'|'boards'>('pedals');
  let pedalQuery = $state('');
  let boardQuery = $state('');

  interface CanvasItem {
    id:string; type:'pedal'|'board'; name:string; brand:string; image:string;
    wIn:number; hIn:number; x:number; y:number; rot:number; z:number; layer:'top'|'bottom';
  }

  const results = $derived(
    tab==='pedals'
      ? (pedalQuery.length>=2 ? pedals.filter(p=>`${p.Brand} ${p.Name}`.toLowerCase().includes(pedalQuery.toLowerCase())).slice(0,80) : [])
      : (boardQuery.length>=1 ? boards.filter(b=>`${b.Brand} ${b.Name}`.toLowerCase().includes(boardQuery.toLowerCase())) : boards.slice(0,40))
  );
  const visible = $derived(canvasItems.filter(i=>{
    if(i.type==='board') return true;
    return i.layer==='top'?showTop:showBottom;
  }));
  const sel = $derived(canvasItems.find(i=>i.id===selectedId));
  const links = $derived(sel?.type==='pedal'?getAffiliateLinks(sel.brand,sel.name):[]);
  const stats = $derived({p:canvasItems.filter(i=>i.type==='pedal').length, b:canvasItems.filter(i=>i.type==='board').length});

  // Context menu position
  const menuPos = $derived(()=>{
    if(!sel) return null;
    const w=inToPixels(sel.wIn,scale);
    return {x:sel.x+w/2, y:sel.y-12};
  });

  onMount(async()=>{
    [pedals,boards]=await Promise.all([loadPedals(),loadBoards()]);
    const s=localStorage.getItem('pn-v3');
    if(s){try{const d=JSON.parse(s);canvasItems=d.items??[];scale=d.scale??40;nextId=d.nextId??1;}catch{}}
  });

  function save(){localStorage.setItem('pn-v3',JSON.stringify({items:canvasItems,scale,nextId}));}

  function addPedal(p:PPPedal){
    const id=`i${nextId++}`;
    canvasItems=[...canvasItems,{id,type:'pedal',name:p.Name,brand:p.Brand,image:pedalImageUrl(p.Image),
      wIn:p.Width,hIn:p.Height,x:250+Math.random()*150,y:80+Math.random()*150,rot:0,z:20,layer:'top'}];
    selectedId=id;save();
  }
  function addBoard(b:PPBoard){
    const id=`i${nextId++}`;
    canvasItems=[...canvasItems,{id,type:'board',name:b.Name,brand:b.Brand,image:boardImageUrl(b.Image),
      wIn:b.Width,hIn:b.Height,x:120,y:60,rot:0,z:1,layer:'top'}];
    save();
  }
  function del(id:string){canvasItems=canvasItems.filter(i=>i.id!==id);if(selectedId===id)selectedId=null;save();}
  function rotate(id:string){canvasItems=canvasItems.map(i=>i.id===id?{...i,rot:(i.rot+90)%360}:i);save();}
  function moveUp(id:string){canvasItems=canvasItems.map(i=>i.id===id?{...i,z:i.z+1}:i);save();}
  function moveDown(id:string){canvasItems=canvasItems.map(i=>i.id===id?{...i,z:Math.max(0,i.z-1)}:i);save();}
  function toTop(id:string){canvasItems=canvasItems.map(i=>i.id===id?{...i,layer:'top',z:20}:i);save();}
  function toBottom(id:string){canvasItems=canvasItems.map(i=>i.id===id?{...i,layer:'bottom',z:5}:i);save();}
  function clearAll(){if(confirm('Clear all?')){canvasItems=[];selectedId=null;save();}}
  function zoomIn(){scale=Math.min(64,scale+4);save();}
  function zoomOut(){scale=Math.max(12,scale-4);save();}
  function zoomFit(){scale=32;save();}

  function startDrag(e:MouseEvent,item:CanvasItem){
    e.preventDefault();selectedId=item.id;
    const r=canvasEl.getBoundingClientRect();
    dragging={id:item.id,ox:e.clientX-item.x-r.left,oy:e.clientY-item.y-r.top};
  }
  function onMove(e:MouseEvent){
    if(!dragging)return;const r=canvasEl.getBoundingClientRect();
    canvasItems=canvasItems.map(i=>i.id!==dragging!.id?i:{...i,x:e.clientX-r.left-dragging!.ox,y:e.clientY-r.top-dragging!.oy});
  }
  function onUp(){if(dragging){dragging=null;save();}}
  function onKey(e:KeyboardEvent){
    const t=(e.target as HTMLElement).tagName;if(t==='INPUT'||t==='SELECT')return;
    if(!selectedId)return;
    if(e.key==='Delete'||e.key==='Backspace'){del(selectedId);e.preventDefault();}
    if(e.key==='r'||e.key==='R')rotate(selectedId);
    if(e.key==='+'||e.key==='=')zoomIn();
    if(e.key==='-')zoomOut();
  }

  function trackClick(mp:string){
    if(!sel)return;
    fetch('/api/clicks',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pedal:`${sel.brand} ${sel.name}`,mp,ts:Date.now()})}).catch(()=>{});
  }
</script>

<svelte:head><title>Pedal Nation</title></svelte:head>
<svelte:window onmousemove={onMove} onmouseup={onUp} onkeydown={onKey} />

<div class="h-screen flex flex-col overflow-hidden">
  <!-- HEADER - just branding + stats -->
  <header class="h-10 bg-[#162447] border-b border-[#2d2d5e] flex items-center px-4 shrink-0 select-none">
    <div class="flex items-center gap-2">
      <span class="text-base">🎸</span>
      <span class="font-bold text-[14px] tracking-wide">PEDAL<span class="text-[#e43f5a]">NATION</span></span>
    </div>
    <div class="ml-auto flex items-center gap-4 text-[12px] text-[#7a7a9e]">
      <span>{stats.p} pedals · {stats.b} boards</span>
      <button class="text-[#e43f5a] hover:text-[#ff6b81] text-[11px]" onclick={clearAll}>Reset</button>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- LEFT SIDEBAR - only search & add -->
    <div class="w-60 bg-[#162447] border-r border-[#2d2d5e] flex flex-col shrink-0">
      <div class="flex border-b border-[#2d2d5e]">
        <button class="flex-1 py-2.5 text-[12px] font-semibold tracking-wider text-center transition-all
          {tab==='pedals'?'text-[#e43f5a] border-b-2 border-[#e43f5a] bg-[#e43f5a08]':'text-[#7a7a9e] hover:text-white'}"
          onclick={()=>tab='pedals'}>🎛️ PEDALS</button>
        <button class="flex-1 py-2.5 text-[12px] font-semibold tracking-wider text-center transition-all
          {tab==='boards'?'text-[#e43f5a] border-b-2 border-[#e43f5a] bg-[#e43f5a08]':'text-[#7a7a9e] hover:text-white'}"
          onclick={()=>tab='boards'}>📐 BOARDS</button>
      </div>
      <div class="p-3">
        {#if tab==='pedals'}
          <input type="text" placeholder="🔍 Search 8000+ pedals..." bind:value={pedalQuery} />
        {:else}
          <input type="text" placeholder="🔍 Search boards..." bind:value={boardQuery} />
        {/if}
      </div>
      <div class="flex-1 overflow-y-auto px-1">
        {#if tab==='pedals' && pedalQuery.length<2}
          <div class="px-4 py-12 text-center text-[#4a4a6e] text-[12px]">Type to search pedals</div>
        {:else if results.length===0}
          <div class="px-4 py-12 text-center text-[#4a4a6e] text-[12px]">No results</div>
        {:else}
          {#each results as item}
            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1f1f3a] transition-colors text-left group"
              onclick={()=>tab==='pedals'?addPedal(item as PPPedal):addBoard(item as PPBoard)}>
              <div class="w-10 h-12 bg-[#111122] rounded-md flex items-center justify-center overflow-hidden shrink-0">
                <img src={tab==='pedals'?pedalImageUrl((item as PPPedal).Image):boardImageUrl((item as PPBoard).Image)}
                  alt="" class="max-w-full max-h-full object-contain"
                  onerror={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-medium text-white truncate group-hover:text-[#e43f5a] transition-colors">{item.Name}</div>
                <div class="text-[11px] text-[#7a7a9e] truncate">{item.Brand} · {item.Width}" × {item.Height}"</div>
              </div>
              <span class="text-[#e43f5a] text-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">+</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>

    <!-- CANVAS -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="flex-1 relative overflow-hidden"
      style="background-color:#0a0a14;background-image:radial-gradient(circle,#222 0.5px,transparent 0.5px);background-size:{scale}px {scale}px;"
      bind:this={canvasEl}
      onmousedown={(e)=>{if(e.target===canvasEl)selectedId=null;}}
      role="application">

      <!-- Canvas items -->
      {#each visible as item (item.id)}
        {@const w=inToPixels(item.wIn,scale)}
        {@const h=inToPixels(item.hIn,scale)}
        {@const isSel=item.id===selectedId}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="absolute cursor-grab active:cursor-grabbing select-none transition-opacity duration-150"
          class:opacity-40={item.layer==='bottom'&&item.type==='pedal'}
          style="left:{item.x}px;top:{item.y}px;z-index:{item.z};transform:rotate({item.rot}deg);
            {isSel?'filter:drop-shadow(0 0 8px rgba(228,63,90,0.6));':''}"
          onmousedown={(e)=>startDrag(e,item)}
          title="{item.brand} {item.name}">
          {#if item.image}
            <img src={item.image} alt={item.name} style="width:{w}px;height:{h}px;" draggable="false" class="pointer-events-none block" />
          {:else}
            <div style="width:{w}px;height:{h}px;border:{Math.max(3,scale*0.4)}px solid #3d3d6e;background:#1a1a2e;border-radius:6px;"></div>
          {/if}
        </div>
      {/each}

      <!-- FLOATING CONTEXT MENU on selected item -->
      {#if sel}
        {@const mp=menuPos()}
        {#if mp}
          <div class="absolute z-[1000] flex items-center gap-1 bg-[#1f1f3a]/95 backdrop-blur border border-[#3d3d6e] rounded-lg px-1.5 py-1 shadow-xl"
            style="left:{mp.x}px;top:{mp.y}px;transform:translate(-50%,-100%);animation:fadeIn 0.1s ease-out;">
            <button class="px-2 py-1 rounded hover:bg-[#2d2d5e] text-[13px] text-[#ccc] hover:text-white transition-colors" onclick={()=>rotate(sel.id)} title="Rotate (R)">↻</button>
            <button class="px-2 py-1 rounded hover:bg-[#2d2d5e] text-[13px] text-[#ccc] hover:text-white transition-colors" onclick={()=>moveUp(sel.id)} title="Move up">↑</button>
            <button class="px-2 py-1 rounded hover:bg-[#2d2d5e] text-[13px] text-[#ccc] hover:text-white transition-colors" onclick={()=>moveDown(sel.id)} title="Move down">↓</button>
            {#if sel.type==='pedal'}
              <div class="w-px h-4 bg-[#3d3d6e] mx-0.5"></div>
              {#if sel.layer==='top'}
                <button class="px-2 py-1 rounded hover:bg-blue-600/20 text-[11px] text-blue-400 hover:text-blue-300 transition-colors" onclick={()=>toBottom(sel.id)} title="Send to bottom layer">▼ Bot</button>
              {:else}
                <button class="px-2 py-1 rounded hover:bg-emerald-600/20 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors" onclick={()=>toTop(sel.id)} title="Send to top layer">▲ Top</button>
              {/if}
            {/if}
            <div class="w-px h-4 bg-[#3d3d6e] mx-0.5"></div>
            <button class="px-2 py-1 rounded hover:bg-red-900/30 text-[13px] text-[#e43f5a] transition-colors" onclick={()=>del(sel.id)} title="Delete (Del)">✕</button>
          </div>
        {/if}
      {/if}

      <!-- CANVAS CONTROLS - bottom left -->
      <div class="absolute bottom-4 left-4 flex items-center gap-1 bg-[#1f1f3a]/90 backdrop-blur border border-[#3d3d6e] rounded-lg px-2 py-1.5 z-[100]">
        <button class="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2d2d5e] text-[#ccc] hover:text-white transition-colors text-[16px] font-bold" onclick={zoomOut} title="Zoom out (-)">−</button>
        <span class="text-[11px] text-[#7a7a9e] w-10 text-center">{Math.round(scale/32*100)}%</span>
        <button class="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2d2d5e] text-[#ccc] hover:text-white transition-colors text-[16px] font-bold" onclick={zoomIn} title="Zoom in (+)">+</button>
        <div class="w-px h-4 bg-[#3d3d6e] mx-1"></div>
        <button class="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2d2d5e] text-[#ccc] hover:text-white transition-colors text-[11px]" onclick={zoomFit} title="Reset zoom">Fit</button>
      </div>

      <!-- LAYER VISIBILITY - bottom right -->
      <div class="absolute bottom-4 right-4 flex items-center gap-1 bg-[#1f1f3a]/90 backdrop-blur border border-[#3d3d6e] rounded-lg px-2 py-1.5 z-[100]">
        <button class="px-2.5 py-1 rounded text-[11px] font-medium transition-all {showTop?'bg-emerald-600/25 text-emerald-400':'text-[#4a4a6e] hover:text-[#7a7a9e]'}"
          onclick={()=>{showTop=!showTop}}>
          👁 Top
        </button>
        <button class="px-2.5 py-1 rounded text-[11px] font-medium transition-all {showBottom?'bg-blue-600/25 text-blue-400':'text-[#4a4a6e] hover:text-[#7a7a9e]'}"
          onclick={()=>{showBottom=!showBottom}}>
          👁 Bottom
        </button>
      </div>
    </div>

    <!-- RIGHT PANEL - Info + Buy Links -->
    <div class="w-64 bg-[#162447] border-l border-[#2d2d5e] shrink-0 overflow-y-auto">
      {#if sel}
        <div class="p-4">
          {#if sel.image}
            <div class="bg-[#111122] rounded-xl p-3 mb-4 flex items-center justify-center">
              <img src={sel.image} alt={sel.name} class="max-w-full max-h-40 object-contain" />
            </div>
          {/if}
          <h3 class="font-bold text-[15px] leading-tight mb-0.5">{sel.name}</h3>
          <p class="text-[13px] text-[#7a7a9e] mb-1">{sel.brand}</p>
          <p class="text-[12px] text-[#4a4a6e] mb-4">
            {sel.wIn}" × {sel.hIn}"
            {#if sel.type==='pedal'}
              · <span class="{sel.layer==='top'?'text-emerald-400':'text-blue-400'} font-medium">{sel.layer}</span> layer
            {/if}
          </p>
          {#if sel.type==='pedal' && links.length>0}
            <div class="border-t border-[#2d2d5e] pt-4">
              <h4 class="text-[11px] uppercase tracking-widest text-[#7a7a9e] font-semibold mb-3">Where to Buy</h4>
              <div class="space-y-2">
                {#each links as link}
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1f1f3a] hover:bg-[#2d2d5e] border border-transparent hover:border-[#3d3d6e] transition-all group"
                    onclick={()=>trackClick(link.id)}>
                    <span class="text-[16px]">{link.icon}</span>
                    <span class="flex-1 text-[13px] font-medium text-white group-hover:text-[#e43f5a] transition-colors">{link.name}</span>
                    <span class="text-[#4a4a6e] group-hover:text-[#e43f5a] transition-colors">→</span>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center h-full px-6 text-center">
          <div class="text-4xl mb-3 opacity-20">🎛️</div>
          <p class="text-[13px] text-[#4a4a6e] leading-relaxed mb-6">
            Search and add pedals.<br/>Click a pedal to see info & buy links.
          </p>
          <div class="text-[11px] text-[#333] space-y-2">
            <div><kbd class="bg-[#1f1f3a] px-1.5 py-0.5 rounded text-[#7a7a9e]">R</kbd> Rotate</div>
            <div><kbd class="bg-[#1f1f3a] px-1.5 py-0.5 rounded text-[#7a7a9e]">Del</kbd> Delete</div>
            <div><kbd class="bg-[#1f1f3a] px-1.5 py-0.5 rounded text-[#7a7a9e]">+/-</kbd> Zoom</div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); }
    to { opacity: 1; transform: translate(-50%, -100%); }
  }
</style>
