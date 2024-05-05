<script lang="ts">
  import { cities } from "$lib/store";
  import { createTable, Render, Subscribe } from "svelte-headless-table";
  import { readable, type Unsubscriber } from "svelte/store";
  import * as Table from "$lib/components/ui/table";
  import type { CityClient } from "$lib/db";

  // Wrapper around cities() to unpromisify and array-ify
  const tableData = readable<(CityClient & { id: string })[]>([], (set) => {
    let unsubscribe: Unsubscriber | null = null;

    cities().then(store => {
      unsubscribe = store.subscribe(value => {
        if (value === null) set([]);
        else {
          set(Object.entries(value.value).map(([id, city]) => ({
            ...city.value,
            id
          })));
        }
      });
    });
    return () => unsubscribe?.();
  });

  const table = createTable(tableData);
  const cols = table.createColumns([
    table.column({ accessor: "name", header: "Name" }),
    table.column({ accessor: ({ lat }) => lat.toFixed(6), header: "Latitude" }),
    table.column({ accessor: ({ long }) => long.toFixed(6), header: "Longitude" }),
    table.column({ accessor: ({ places }) => places.length, header: "Places" }),
    table.column({ accessor: ({ id }) => id, header: "" }),
  ]);

  const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(cols);
</script>

<svelte:head>
  <title>Cities - Trip Planning</title>
</svelte:head>

<h2 class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Cities
</h2>

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
          <Table.Row {...rowAttrs}>
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