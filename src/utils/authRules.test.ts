import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessAdminPanel,
  canManageGestorRoles,
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './authRules';

test('Apenas Administrador e Gestor podem aceder ao painel administrativo', () => {
  assert.equal(canAccessAdminPanel('admin'), true);
  assert.equal(canAccessAdminPanel('gestor'), true);
  assert.equal(canAccessAdminPanel('user'), false);
  assert.equal(canAccessAdminPanel(null), false);
});

test('Apenas o perfil Administrador pode nomear ou remover gestores', () => {
  assert.equal(canManageGestorRoles('admin'), true);
  assert.equal(canManageGestorRoles('gestor'), false);
  assert.equal(canManageGestorRoles('user'), false);
});

test('Hashing e verificação de palavra-passe com scrypt', () => {
  const hash = hashPassword('SenhaSegura2026');
  assert.equal(verifyPassword('SenhaSegura2026', hash), true);
  assert.equal(verifyPassword('SenhaErrada', hash), false);
});

test('Assinatura e verificação de token de sessão', () => {
  const secret = 'test-secret-omuwa';
  const token = signSessionToken(
    {
      userId: 'u-1',
      email: 'gestor@huila.ao',
      role: 'gestor',
      exp: Date.now() + 60_000,
    },
    secret
  );
  const decoded = verifySessionToken(token, secret);
  assert.ok(decoded);
  assert.equal(decoded?.role, 'gestor');
  assert.equal(verifySessionToken(token, 'wrong-secret'), null);
});
