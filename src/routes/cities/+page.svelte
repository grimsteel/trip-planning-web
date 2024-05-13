<script lang="ts">
  import { createTable, Render, Subscribe, createRender } from "svelte-headless-table";
  import { addTableFilter } from "svelte-headless-table/plugins";
  import Plus from "lucide-svelte/icons/plus"

  import { writable } from "svelte/store";

  import { cities, loro } from "$lib/store";
  import * as Table from "$lib/components/ui/table";
  import Input from "$lib/components/ui/input/input.svelte";

  import Button from "$lib/components/ui/button/button.svelte";

  import CitiesTableActions from "./cities-table-actions.svelte";
  import { flattenLoroClientMap, recordToArray, unpromisifyStore } from "$lib/utils";
  import { Map as MapComponent } from "$lib/components/ui/map";

  // Wrapper around cities() to unpromisify and array-ify
  const tableData = unpromisifyStore(cities(), value => recordToArray(flattenLoroClientMap(value.value), "id"), []);

  const table = createTable(tableData, {
    filter: addTableFilter({
      fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
    })
  });
  const cols = table.createColumns([
    table.column({ accessor: "name", header: "Name", plugins: { filter: { exclude: false } } }),
    table.column({ accessor: ({ lat }) => lat.toFixed(6), header: "Latitude", plugins: { filter: { exclude: true } } }),
    table.column({ accessor: ({ long }) => long.toFixed(6), header: "Longitude", plugins: { filter: { exclude: true } } }),
    table.column({ accessor: ({ places }) => places.length, header: "Places", plugins: { filter: { exclude: true } } }),
    table.column({
      accessor: value => value, header: "", plugins: { filter: { exclude: true } },
      cell: ({ value }) => {
        const render = createRender(CitiesTableActions, { city: value });
        render.on("delete", async () => {
          // @ts-expect-error
          await loro.cities?.delete(value.id);
          await loro.save();
        });
        return render;
      }
    }),
  ]);

  const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(cols);
  const { filterValue } = pluginStates.filter;

  const hoveredMarker = writable<string | null>(null);

  async function onMarkerDrag({ id, lat, long }: { id: string, lat: number, long: number }) {
    await loro.editCity(id, lat, long);
    await loro.save();
  }
</script>

<svelte:head>
  <title>Cities - Trip Planning</title>
</svelte:head>

<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Cities
</h2>

<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div>
    <MapComponent initialPosition={{ lat: 41.156, long: -102.302, zoom: 4 }} markers={tableData} {hoveredMarker} on:marker-drag={({ detail }) => onMarkerDrag(detail)} />
  </div>
  
  <div>
    <div class="flex items-center mb-3">
      <Input class="max-w-sm" placeholder="Filter cities..." type="text" bind:value={$filterValue} />
      <Button href="/cities/create" variant="secondary" class="ml-3">
        <Plus class="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>

    <div class="rounded-md border">
      <Table.Root {...$tableAttrs}>
        <Table.Header>
          {#each $headerRows as headerRow}
            <Subscribe rowAttrs={headerRow.attrs()}>
              <Table.Row>
                {#each headerRow.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                    <Table.Head {...attrs}>
                      <Render of={cell.render()} />
                    </Table.Head>
                  </Subscribe>
                {/each}
              </Table.Row>
            </Subscribe>
          {/each}
        </Table.Header>
        <Table.Body {...$tableBodyAttrs}>
          {#each $pageRows as row (row.id)}
            <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
              <Table.Row
                {...rowAttrs}
                class={row.isData() && row.original.id === $hoveredMarker ? "bg-muted/75" : ""}
                on:mouseenter={() => row.isData() && hoveredMarker.set(row.original.id)}
                on:mouseleave={() => row.isData() && hoveredMarker.set(null)}
              >
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    <Table.Cell {...attrs}>
                      <Render of={cell.render()} />
                    </Table.Cell>
                  </Subscribe>
                {/each}
              </Table.Row>
            </Subscribe>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
</div>
