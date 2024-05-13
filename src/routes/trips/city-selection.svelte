<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import type { Id } from "$lib/db";
  import { cities } from "$lib/store";
  import { flattenLoroClientMap, recordToArray, unpromisifyStore } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import Plus from "lucide-svelte/icons/plus";
  import Search from "lucide-svelte/icons/search";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ selected: { id: Id } }>();

  const allCities = unpromisifyStore(
    cities(),
    c => recordToArray(flattenLoroClientMap(c.value), "id"),
    []
  );

  function onKeyup(e: KeyboardEvent) {
    if (e.key === "Enter" && selectedCityId) {
      popoverOpen = false;
      dispatch("selected", { id: selectedCityId });
    }
  }

  function onClickCity(id: Id) {
    popoverOpen = false;
    dispatch("selected", { id });
  }

  let search: string = "";

  $: availableCities = $allCities // Exclude selected cities and apply search
    .filter(({ id, name }) => !selectedCities.has(id) && (!search || name.toLowerCase().includes(search.toLowerCase())));

  export let showText: boolean = false;
  export let selectedCities: Set<Id>;

  let popoverOpen = false;

  let selectedCityId: Id | null;
  $: selectedCityId = availableCities[0]?.id ?? null;
</script>

<Popover.Root bind:open={popoverOpen}>
  <Popover.Trigger asChild let:builder>  
    {#if showText}   
      <Button variant="secondary" builders={[builder]}>
        <Plus class="h-4 w-4 mr-2" />
        Add a City
      </Button>
    {:else}
      <Button variant="outline" size="icon" builders={[builder]}>
        <Plus class="h-4 w-4" />
      </Button>
    {/if}
  </Popover.Trigger>
  <Popover.Content class="p-1">
    <!-- search input box -->
    <div class="flex items-center border-b px-2">
      <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        type="text" bind:value={search} placeholder="Search cities..." on:keyup={onKeyup}
        class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
    <!-- city list -->
    <ScrollArea class="max-h-[300px]">
      {#each availableCities as city (city.id)}
        <div
          role="option"
          tabindex="0"
          aria-selected={selectedCityId === city.id}
          on:mouseenter={() => selectedCityId = city.id}
          on:mouseleave={() => selectedCityId = null}
          on:click={() => onClickCity(city.id)}
          on:keyup={onKeyup}
          class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
        >
          {city.name}
        </div>
      {/each}
    </ScrollArea>
  </Popover.Content>
</Popover.Root>