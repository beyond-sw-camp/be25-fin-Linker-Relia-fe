<template>
  <footer class="app-footer">
    <nav class="app-footer__links" aria-label="footer">
      <a href="/">개인정보처리방침</a>
      <a href="/">이용약관</a>
    </nav>
    <p>© 2026 Relia All rights reserved.</p>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 72px;
  padding: 14px 16px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f5f7fb;
  color: #6b7280;
  text-align: center;
}

.app-footer__links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.app-footer__links a,
.app-footer p {
  font-size: 12px;
  color: #6b7280;
}

.app-footer p {
  margin: 0;
}
</style>
