<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { loadPedals, type PPPedal } from '$lib/data/pedals';
  import { MARKETPLACES } from '$lib/data/affiliates';

  let user = $state<any>(null);
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let activeTab = $state<'overview'|'pedals'|'links'>('overview');

  let pedals = $state<PPPedal[]>([]);

  onMount(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
    pedals = await loadPedals();
  });

  async function login() {
    if (!supabase) { error = 'Supabase not configured'; return; }
    loading = true; error = '';
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { error = err.message; }
    else {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user ?? null;
    }
    loading = false;
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    user = null;
  }
</script>

<svelte:head><title>Admin — Pedal Nation</title></svelte:head>

<div class="min-h-screen bg-[#1b1b2f] text-white">
  {#if !user}
    <!-- Login -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="w-full max-w-sm bg-[#162447] border border-[#2d2d5e] rounded-2xl p-8">
        <div class="text-center mb-6">
          <span class="text-2xl">🎸</span>
          <h1 class="text-xl font-bold mt-2">PEDAL<span class="text-[#e43f5a]">NATION</span></h1>
          <p class="text-[#7a7a9e] text-sm mt-1">Admin Dashboard</p>
        </div>

        {#if error}
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>
        {/if}

        <form onsubmit={(e) => { e.preventDefault(); login(); }} class="space-y-3">
          <input type="email" placeholder="Email" bind:value={email} class="w-full" required />
          <input type="password" placeholder="Password" bind:value={password} class="w-full" required
            style="background:#111122;color:#f0f0f0;border:1px solid #2d2d5e;border-radius:6px;padding:8px 10px;font-size:13px;" />
          <button type="submit" disabled={loading}
            class="w-full py-2.5 bg-[#e43f5a] hover:bg-[#ff6b81] text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <a href="/" class="block text-center text-[#7a7a9e] text-sm mt-4 hover:text-white">← Back to builder</a>
      </div>
    </div>
  {:else}
    <!-- Dashboard -->
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">PEDAL<span class="text-[#e43f5a]">NATION</span> Admin</h1>
          <p class="text-[#7a7a9e] text-sm">{user.email}</p>
        </div>
        <div class="flex gap-3">
          <a href="/" class="px-4 py-2 bg-[#1f1f3a] hover:bg-[#2d2d5e] rounded-lg text-sm transition-colors">← Builder</a>
          <button onclick={logout} class="px-4 py-2 bg-[#e43f5a22] text-[#e43f5a] hover:bg-[#e43f5a33] rounded-lg text-sm transition-colors">Logout</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-8">
        {#each [
          { label: 'Total Pedals', value: '8,193', icon: '🎛️', color: '#e43f5a' },
          { label: 'Total Boards', value: '245', icon: '📐', color: '#22c55e' },
          { label: 'Marketplaces', value: String(MARKETPLACES.length), icon: '🛒', color: '#3b82f6' },
          { label: 'Clicks Today', value: '—', icon: '📊', color: '#f59e0b' },
        ] as stat}
          <div class="bg-[#1f1f3a] border border-[#2d2d5e] rounded-xl p-5">
            <div class="text-2xl mb-1">{stat.icon}</div>
            <div class="text-2xl font-bold" style="color:{stat.color}">{stat.value}</div>
            <div class="text-[12px] text-[#7a7a9e] mt-1">{stat.label}</div>
          </div>
        {/each}
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 bg-[#1f1f3a] rounded-lg p-1 w-fit">
        {#each [['overview','Overview'],['pedals','Pedals'],['links','Affiliate Links']] as [key, label]}
          <button class="px-4 py-2 rounded-md text-sm transition-all
            {activeTab===key?'bg-[#e43f5a] text-white font-semibold':'text-[#7a7a9e] hover:text-white'}"
            onclick={()=>activeTab=key as any}>{label}</button>
        {/each}
      </div>

      {#if activeTab === 'overview'}
        <div class="bg-[#1f1f3a] border border-[#2d2d5e] rounded-xl p-6">
          <h3 class="font-semibold mb-4">Marketplace Configuration</h3>
          <div class="space-y-3">
            {#each MARKETPLACES as mp}
              <div class="flex items-center gap-4 bg-[#111122] rounded-lg p-4">
                <span class="text-xl">{mp.icon}</span>
                <div class="flex-1">
                  <div class="font-medium">{mp.name}</div>
                  <div class="text-[12px] text-[#7a7a9e]">Commission: {mp.commission}</div>
                </div>
                <span class="text-[#22c55e] text-sm">Active ✓</span>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'pedals'}
        <div class="bg-[#1f1f3a] border border-[#2d2d5e] rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-[#2d2d5e] text-[#7a7a9e] text-sm">
            Showing first 50 pedals — full management coming soon
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[#7a7a9e] text-[11px] uppercase tracking-wider border-b border-[#2d2d5e]">
                <th class="text-left px-5 py-3">Brand</th>
                <th class="text-left px-5 py-3">Name</th>
                <th class="text-left px-5 py-3">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {#each pedals.slice(0, 50) as p}
                <tr class="border-b border-[#2d2d5e]/50 hover:bg-[#2d2d5e22] transition-colors">
                  <td class="px-5 py-2.5 text-[#7a7a9e]">{p.Brand}</td>
                  <td class="px-5 py-2.5 font-medium">{p.Name}</td>
                  <td class="px-5 py-2.5 text-[#7a7a9e] font-mono text-[12px]">{p.Width}" × {p.Height}"</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="bg-[#1f1f3a] border border-[#2d2d5e] rounded-xl p-6">
          <h3 class="font-semibold mb-4">Affiliate Link Configuration</h3>
          <p class="text-[#7a7a9e] text-sm mb-4">Configure affiliate codes and custom URLs per marketplace. Coming soon — currently using search URLs.</p>
          <div class="space-y-3">
            {#each MARKETPLACES as mp}
              <div class="bg-[#111122] rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-lg">{mp.icon}</span>
                  <span class="font-medium">{mp.name}</span>
                  <span class="text-[11px] text-[#7a7a9e] ml-auto">Commission: {mp.commission}</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[11px] text-[#7a7a9e] mb-1 block">Affiliate ID</label>
                    <input type="text" placeholder="e.g. pedalnation-20" class="text-[12px]" />
                  </div>
                  <div>
                    <label class="text-[11px] text-[#7a7a9e] mb-1 block">Custom URL Pattern</label>
                    <input type="text" placeholder="Optional override" class="text-[12px]" />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
