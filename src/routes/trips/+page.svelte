<script lang="ts">
  import { createTable, Render, Subscribe, createRender } from "svelte-headless-table";
  import { addTableFilter } from "svelte-headless-table/plugins";
  import Plus from "lucide-svelte/icons/plus"

  import { loro, trips } from "$lib/store";
  import * as Table from "$lib/components/ui/table";
  import Input from "$lib/components/ui/input/input.svelte";

  import "leaflet/dist/leaflet.css";
  import Button from "$lib/components/ui/button/button.svelte";

  import { flattenLoroClientMap, recordToArray, unpromisifyStore } from "$lib/utils";
  import TripsTableActions from "./trips-table-actions.svelte";

  // Wrapper around cities() to unpromisify and array-ify
  const tableData = unpromisifyStore(trips(), value => recordToArray(flattenLoroClientMap(value.value), "id"), []);

  const table = createTable(tableData, {
    filter: addTableFilter({
      fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
    })
  });
  const cols = table.createColumns([
    table.column({ accessor: "name", header: "Name", plugins: { filter: { exclude: false } } }),
    table.column({ accessor: "date", header: "Date", plugins: { filter: { exclude: true } } }),
    table.column({ accessor: ({ cities }) => cities.length, header: "Cities", plugins: { filter: { exclude: true } } }),
    table.column({
      accessor: value => value, header: "", plugins: { filter: { exclude: true } },
      cell: ({ value }) => {
        const render = createRender(TripsTableActions, { tripId: value.id });
        render.on("delete", async () => {
          // @ts-expect-error
          await loro.trips?.delete(value.id);
          await loro.save();
        });
        return render;
      }
    }),
  ]);

  const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(cols);
  const { filterValue } = pluginStates.filter;
</script>

<svelte:head>
  <title>Trips - Trip Planning</title>
</svelte:head>

<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Trips
</h2>


<div class="flex items-center mb-3">
  <Input class="max-w-sm" placeholder="Filter trips..." type="text" bind:value={$filterValue} />
  <Button href="/trips/create" variant="secondary" class="ml-3">
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
