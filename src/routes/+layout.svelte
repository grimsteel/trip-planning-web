<script>
  import * as Sheet from "$lib/components/ui/sheet";
  import { Button } from "$lib/components/ui/button";
  import Menu from "lucide-svelte/icons/menu";
  import "../app.css";
  import icon from "../assets/icon-192.png";
  import { page } from "$app/stores";
  import { tv } from "tailwind-variants";

  const navLink = tv({
    base: "text-muted-foreground transition-colors hover:text-foreground",
    variants: {
      active: {
        true: "text-emerald-400 hover:text-emerald-100"
      }
    }
  });
</script>
<div class="flex min-h-screen w-full flex-col">
  <header class="sticky top-0 flex h-16 items-center gap-4 border-b bg-zinc-900 px-4 md:px-6">
    <nav class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold md:text-base">
        <img src={icon} class="h-6 w-6" alt="Trip Planning Icon" />
        <span class="sr-only">Trip Planning</span>
      </a>
      <a href="/" class={navLink({ active: $page.route.id === "/" })}>
        Trip Dashboard
      </a>
      <a href="/" class={navLink()}>
        Trips
      </a>
      <a href="/cities" class={navLink({ active: $page.route.id === "/cities" })}>
        Cities
      </a>
      <a href="/" class={navLink()}>
        Places
      </a>
      <a href="/" class={navLink()}>
        Points of Interest
      </a>
    </nav>

    <Sheet.Root>
      <Sheet.Trigger asChild let:builder>
        <Button
          variant="outline"
          size="icon"
          class="shrink-0 md:hidden"
          builders={[builder]}
        >
          <Menu class="h-5 w-5" />
          <span class="sr-only">Toggle navigation menu</span>
        </Button>
      </Sheet.Trigger>
      <Sheet.Content side="left">
        <nav class="grid gap-6 text-lg font-medium">
          <a href="##" class="flex items-center gap-2 text-lg font-semibold">
            <img src={icon} class="h-6 w-6" alt="Trip Planning Icon" />
            <span class="sr-only">Trip Planning</span>
          </a>
          <a href="##" class="text-muted-foreground hover:text-foreground"> Trip Dashboard </a>
          <a href="##" class="text-muted-foreground hover:text-foreground"> Trips </a>
          <a href="##" class="text-muted-foreground hover:text-foreground"> Cities </a>
          <a href="##" class="text-muted-foreground hover:text-foreground"> Places </a>
          <a href="##" class="text-muted-foreground hover:text-foreground"> Points of Interest </a>
        </nav>
      </Sheet.Content>
    </Sheet.Root>
  </header>

  <main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <slot />
  </main>
  
</div>