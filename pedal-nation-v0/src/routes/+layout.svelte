<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-[#1a1a2e] text-white">
  {@render children()}
</div>
