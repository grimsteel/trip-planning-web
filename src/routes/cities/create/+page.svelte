<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import type { CityClient, Id } from "$lib/db";
  import { LoroMapClient, LoroMovableListClient } from "$lib/loro-converters/client";
  import { loro } from "$lib/store";
  import { nanoid } from "nanoid";

  let cityName: string;
  let latitude: number;
  let longitude: number;

  let couldNotGeolocate = false;

  const latCommaLongRe = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;

  // Handle pasting from plus codes/lat [comma] long
  async function onPaste(e: ClipboardEvent) {
    if (e.clipboardData) {
      const data = e.clipboardData.getData("text");
      // Check if it matches lat [comma] long
      const latLongMatch = data.match(latCommaLongRe);
      if (latLongMatch) {
        e.preventDefault();
        const [, lat, long] = latLongMatch;
        latitude = parseFloat(lat);
        longitude = parseFloat(long);
      }
    }
  }

  async function onSubmit(_e: SubmitEvent) {
    const cityMap = new LoroMapClient<CityClient>({
      name: cityName,
      lat: latitude,
      long: longitude,
      places: new LoroMovableListClient<Id>()
    });

    const id = nanoid(10);

    // @ts-expect-error Chaining not supported with ts types
    await loro.cities?.setContainer(id, cityMap);
    await loro.save();

    await goto(`/cities`);
  }

  async function geocodeLatLong() {
    // Make the request to maptiler
    const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(cityName)}.json?key=UjpNLDYv0IUeN6MR7XW8&limit=1&types=place`);
    const { features } = await res.json();
    if (features.length >= 1) {
      couldNotGeolocate = false;

      // Store the lat/long
      const center = features[0].center;
      latitude = center[1];
      longitude = center[0];
    } else {
      couldNotGeolocate = true;
    }
  }
</script>
<svelte:head>
  <title>Add a City - Trip Planning</title>
</svelte:head>

<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Add a City
</h2>

<form on:submit|preventDefault={onSubmit}>
  <div class="flex gap-1 mb-3 w-full max-w-lg flex-col">
    <Label for="city-name">Name</Label>
    <Input id="city-name" type="text" placeholder="Austin, Texas" required bind:value={cityName} />
    {#if couldNotGeolocate}
      <p class="text-sm text-rose-500">Could not locate city</p>
    {/if}
  </div>

  <div class="flex flex-col md:flex-row gap-3 max-w-lg">
    <div class="flex gap-1 mb-3 w-full flex-col">
      <Label for="latitude">Latitude</Label>
      <Input id="latitude" type="number" required bind:value={latitude} on:paste={onPaste} step="any" />
    </div>
    <div class="flex gap-1 mb-3 w-full flex-col">
      <Label for="longitude">Longitude</Label>
      <Input id="longitude" type="number" required bind:value={longitude} on:paste={onPaste} step="any" />
    </div>
  </div>

  {#if latitude && longitude}
    <a class="text-sm text-muted-foreground hover:underline hover:text-foreground mb-3 block" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`}>Open in Google Maps</a>
  {/if}

  {#if cityName}
    <Button type="button" on:click={geocodeLatLong} variant="secondary" class="mb-3">Guess Lat/Long</Button>
  {/if}

  <Button type="submit">Save</Button>
</form>