<script lang="ts">
  import Ellipsis from "lucide-svelte/icons/ellipsis";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from "svelte";
 
  export let city: { lat: number, long: number, id: string };

  const dispatcher = createEventDispatcher();
</script>
 
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      variant="ghost"
      builders={[builder]}
      size="icon"
      class="relative h-8 w-8 p-0"
    >
      <span class="sr-only">Open menu</span>
      <Ellipsis class="h-4 w-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Group>
      <DropdownMenu.Label>Actions</DropdownMenu.Label>
      <DropdownMenu.Item on:click={() => open(`https://www.google.com/maps/search/?api=1&query=${city.lat}%2C${city.long}`)}>
        Open in Google Maps
      </DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Item on:click={() => goto(`/cities/${city.id}`)}>
      Edit
    </DropdownMenu.Item>
    <DropdownMenu.Item on:click={() => dispatcher("delete")}>
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>