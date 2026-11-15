const assert = require('node:assert/strict');
const test = require('node:test');
const { getMemberRoleSnapshot, restoreMemberRoles } = require('../src/voided-role');

test('role snapshot excludes the everyone and managed roles', async () => {
  const member = {
    roles: {
      cache: new Map([
        ['guild-1', { id: 'guild-1', managed: false }],
        ['role-1', { id: 'role-1', managed: false }],
        ['role-managed', { id: 'role-managed', managed: true }],
      ]),
    },
  };
  const guild = { id: 'guild-1', members: { fetch: async () => member } };

  assert.deepEqual(await getMemberRoleSnapshot(guild, 'buyer-1'), ['role-1']);
});

test('role restoration adds only existing, assignable roles the member does not have', async () => {
  const addedRoles = [];
  const member = {
    roles: {
      cache: new Map([['role-existing', { id: 'role-existing' }]]),
      add: async (role) => addedRoles.push(role.id),
    },
  };
  const guild = {
    id: 'guild-1',
    members: { fetch: async () => member },
    roles: {
      fetch: async (roleId) => ({
        id: roleId,
        managed: roleId === 'role-managed',
      }),
    },
  };

  assert.deepEqual(
    await restoreMemberRoles(guild, 'buyer-1', [
      'guild-1',
      'role-existing',
      'role-to-restore',
      'role-managed',
    ]),
    ['role-to-restore'],
  );
  assert.deepEqual(addedRoles, ['role-to-restore']);
});
