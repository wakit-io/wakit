<script>
  let { data } = $props();
</script>

<!-- Shared content (styles via /app-shared.css). Renders on web + app alike. -->
<article class="post">
  <a class="post__back" href="/board/">← Board</a>
  <span class="sc-badge">Single source · SvelteKit</span>
  <h1>{data.title}</h1>
  <p>{data.body}</p>
</article>
