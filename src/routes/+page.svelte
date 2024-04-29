<script lang="ts">
  import SyncWorker from "$lib/sync-worker?sharedworker";
  import { onMount } from "svelte";

  onMount(() => {
    console.log(new SyncWorker());
  });
</script>

<h1>Trip Planning</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
