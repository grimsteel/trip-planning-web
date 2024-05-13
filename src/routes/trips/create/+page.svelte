<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import type { Id, TripClient } from "$lib/db";
  import { LoroMapClient, LoroMovableListClient } from "$lib/loro-converters/client";
  import { cities, loro } from "$lib/store";
  import { unpromisifyStore } from "$lib/utils";
  import { nanoid } from "nanoid";
  import CitySelection from "../city-selection.svelte";
  import Trash from "lucide-svelte/icons/trash";

  let tripName: string;
  let date: string;
  let selectedCities = new Set<Id>();

  const allCities = unpromisifyStore(cities(), c => c.value, {});

  async function onSubmit(_e: SubmitEvent) {
    const tripMap = new LoroMapClient<TripClient>({
      name: tripName,
      date,
      cities: new LoroMovableListClient(...selectedCities)
    });

    const id = nanoid(10);

    // @ts-expect-error Chaining not supported with ts types
    await loro.trips?.setContainer(id, tripMap);
    await loro.save();

    await goto(`/trip`);
  }
</script>
<svelte:head>
  <title>Add a Trip - Trip Planning</title>
</svelte:head>

<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Add a Trip
</h2>

<form on:submit|preventDefault={onSubmit}>
  <div class="flex gap-1 mb-3 w-full max-w-lg flex-col">
    <Label for="trip-name">Name</Label>
    <Input id="trip-name" type="text" placeholder="Utah - Colorado" required bind:value={tripName} />
  </div>

  <div class="flex gap-1 mb-3 w-full max-w-lg flex-col">
    <Label for="date">Date</Label>
    <Input id="date" type="text" placeholder="Summer 2023" required bind:value={date} />
  </div>

  <small class="text-sm font-medium leading-none block mb-3">Cities</small>

  <div class="flex flex-col gap-3 mb-3 max-w-xl">
    {#each selectedCities as cityId (cityId)}
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-3 flex items-center">
        <span>{$allCities[cityId].get("name")}</span>
        <Button variant="destructive" size="icon" class="ml-auto">
          <Trash class="w-4 h-4" />
        </Button>
      </div>
    {/each}
  </div>

  <div class="mb-3">
    <CitySelection {selectedCities} showText on:selected={e => { selectedCities.add(e.detail.id); selectedCities = selectedCities }}/>
  </div>

  <Button type="submit">Save</Button>
</form>