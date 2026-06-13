<!-- Profile (single source). Renders on the web at /profile/ and inside the wakit
     app (My tab). Styles + dark/light come from /app-shared.css; the theme controls
     (data-theme-option) are driven by the same theme-toggle.js the app uses.
     Placeholder links use href="#" (real targets are the recipient's to wire up). -->
<main class="profile-page">
  <div class="container">

    <span class="sc-badge">Single source · SvelteKit</span>

    <!-- Summary card -->
    <section class="profile-card">
      <div class="profile-card__avatar"><i class="bi bi-person-fill"></i></div>
      <div class="profile-card__info">
        <h1 class="profile-card__name">John Doe</h1>
        <p class="profile-card__email">hong@example.com</p>
      </div>
      <a href="#" class="profile-card__edit">Edit profile</a>
    </section>

    <!-- Stats -->
    <section class="profile-stats">
      <a class="profile-stats__item" href="#"><strong class="profile-stats__num">12</strong><span class="profile-stats__label">Activity</span></a>
      <a class="profile-stats__item" href="#"><strong class="profile-stats__num">8</strong><span class="profile-stats__label">Saved</span></a>
      <a class="profile-stats__item" href="#"><strong class="profile-stats__num">3</strong><span class="profile-stats__label">Alerts</span></a>
    </section>

    <!-- Activity menu -->
    <section class="profile-section">
      <h2 class="profile-section__title">My activity</h2>
      <nav class="profile-menu">
        <a class="profile-menu__item" href="#"><i class="bi bi-clock-history profile-menu__icon"></i><span class="profile-menu__label">Recently viewed</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
        <a class="profile-menu__item" href="#"><i class="bi bi-bookmark profile-menu__icon"></i><span class="profile-menu__label">Saved items</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
        <a class="profile-menu__item" href="#"><i class="bi bi-chat-square-text profile-menu__icon"></i><span class="profile-menu__label">My comments</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
      </nav>
    </section>

    <!-- Theme setting (system / light / dark) -->
    <section class="profile-section">
      <h2 class="profile-section__title">Theme</h2>
      <div class="theme-options" role="radiogroup" aria-label="Theme">
        <button type="button" class="theme-options__item" data-theme-option="system" role="radio" aria-checked="false"><i class="bi bi-circle-half"></i><span>System</span></button>
        <button type="button" class="theme-options__item" data-theme-option="light" role="radio" aria-checked="false"><i class="bi bi-sun"></i><span>Light</span></button>
        <button type="button" class="theme-options__item" data-theme-option="dark" role="radio" aria-checked="false"><i class="bi bi-moon-stars"></i><span>Dark</span></button>
      </div>
    </section>

    <!-- Settings menu -->
    <section class="profile-section">
      <h2 class="profile-section__title">Settings</h2>
      <nav class="profile-menu">
        <a class="profile-menu__item" href="#"><i class="bi bi-person-gear profile-menu__icon"></i><span class="profile-menu__label">Account</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
        <a class="profile-menu__item" href="#"><i class="bi bi-bell profile-menu__icon"></i><span class="profile-menu__label">Notifications</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
        <a class="profile-menu__item" href="#"><i class="bi bi-headset profile-menu__icon"></i><span class="profile-menu__label">Support</span><i class="bi bi-chevron-right profile-menu__arrow"></i></a>
      </nav>
    </section>

    <!-- Account actions -->
    <section class="profile-account">
      <a href="#" class="profile-account__logout">Log out</a>
      <a href="#" class="profile-account__withdraw">Delete account</a>
    </section>

  </div>
</main>
