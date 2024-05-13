<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import mapPinIcon from "./map-pin.svg?url";
  import type { Map as LeafletMap, Marker } from "leaflet";
  import type { Readable, Unsubscriber, Writable } from "svelte/store";

  export let initialPosition: { lat: number, long: number, zoom: number };
  export let markers: Readable<{ name: string, lat: number, long: number, id: string }[]>;
  export let hoveredMarker: Writable<string | null>;

  import "leaflet/dist/leaflet.css";

  let currentMap: LeafletMap;
  let pinMarkers = new Map<string, Marker>();
  let mapDiv: HTMLDivElement;

  let pinMarkersUnsubscribe: Unsubscriber;
  let hoveredMarkerUnsubscribe: Unsubscriber;

  const dispatch = createEventDispatcher<{ "marker-drag": { id: string, lat: number, long: number } }>();

  onMount(async () => {
    // Dynamic import because of prerendering errors
    const { map, tileLayer, marker, icon } = await import("leaflet");

    // Our custom icon
    const defaultIcon = icon({
      iconUrl: mapPinIcon,
      iconSize: [20, 35],
      iconAnchor: [10, 35]
    });

    currentMap = map(mapDiv, {
      layers: [
        tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=UjpNLDYv0IUeN6MR7XW8`, {
          maxZoom: 19,
          attribution: '&copy; <a href="https://maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributers</a>'
        }),
        ...pinMarkers.values()
      ]
    }).setView([initialPosition.lat, initialPosition.long], initialPosition.zoom);

    // Handle changes to cities in the markers
    pinMarkersUnsubscribe = markers.subscribe(data => {
      pinMarkers.forEach(marker => marker.remove());
      pinMarkers.clear();
      data.forEach(item => {
        // Create the marker
        const m = marker([ item.lat, item.long ], {
          draggable: true,
          title: item.name,
          icon: defaultIcon
        }).addEventListener("dragend", async e => {
          // Dispatch this event
          const { lat, lng } = m.getLatLng();
          dispatch("marker-drag", { id: item.id, lat, long: lng });
        })
        // Hover event listeners
        .addEventListener("mouseover", () => hoveredMarker.set(item.id))
        .addEventListener("mouseout", () => hoveredMarker.set(null))
        .bindPopup(item.name);

        pinMarkers.set(item.id, m);
      });

      // Add the markers to the map
      if (currentMap) pinMarkers.forEach(marker => currentMap?.addLayer(marker));
    });

    hoveredMarkerUnsubscribe = hoveredMarker.subscribe(id => {
      document.querySelector(".leaflet-marker-icon.row-hovered")?.classList.remove("row-hovered");
      if (id) {
        pinMarkers.get(id)?.getElement()?.classList.add("row-hovered");
      }
    });
  });

  onDestroy(() => {
    pinMarkersUnsubscribe?.();
  });
</script>

<!-- map -->
<div bind:this={mapDiv} class="h-96"></div>

<style>
  :global(.leaflet-marker-icon:is(.row-hovered, :hover)) {
    filter: brightness(0.75);
  }
</style>