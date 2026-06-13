<script>
  let { data } = $props();
</script>

<!-- Content authored ONCE here. Rendered on the web at /board/ and ALSO
     fetched into the wakit app (List tab). Styles come from the shared
     /app-shared.css that both shells load — no scoped <style> here. -->
<section class="board">
  <header class="board__head">
    <span class="sc-badge">Single source · SvelteKit</span>
    <h1>Board</h1>
    <p>This exact markup renders on the web and inside the app.</p>
  </header>

  <ul class="board__list">
    {#each data.posts as post}
      <li class="board__item">
        <a href={`/board/${post.id}/`}>
          <h2>{post.title}</h2>
          <span>{post.meta}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>
