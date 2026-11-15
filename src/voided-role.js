async function setVoidedRole(guild, roleId, userId, enabled) {
  if (!guild || !roleId || !userId) return false;

  const [role, member] = await Promise.all([
    guild.roles.fetch(roleId),
    guild.members.fetch(userId, { force: true }),
  ]);
  if (!role) throw new Error(`Voided role ${roleId} was not found.`);
  if (!member) throw new Error(`Guild member ${userId} was not found.`);

  const hasRole = member.roles.cache.has(role.id);
  if (enabled && !hasRole) {
    await member.roles.add(role);
    return true;
  }
  if (!enabled) {
    await member.roles.remove(role);
    return hasRole;
  }
  return false;
}

async function getMemberRoleSnapshot(guild, userId) {
  const member = await guild.members.fetch(userId, { force: true });
  if (!member) throw new Error(`Guild member ${userId} was not found.`);
  return [...member.roles.cache.values()]
    .filter((role) => role.id !== guild.id && !role.managed)
    .map((role) => role.id);
}

async function restoreMemberRoles(guild, userId, roleIds) {
  if (!guild || !userId || !Array.isArray(roleIds)) return [];
  const member = await guild.members.fetch(userId, { force: true });
  if (!member) throw new Error(`Guild member ${userId} was not found.`);

  const roles = [];
  for (const roleId of new Set(roleIds)) {
    if (roleId === guild.id) continue;
    try {
      const role = await guild.roles.fetch(roleId);
      if (role) roles.push(role);
      else console.error(`Could not restore role ${roleId}: it no longer exists.`);
    } catch (error) {
      console.error(`Could not fetch role ${roleId} for restoration:`, error);
    }
  }
  const rolesToAdd = roles.filter((role) => (
    role && !role.managed && !member.roles.cache.has(role.id)
  ));
  const addedRoleIds = [];
  const failures = [];
  for (const role of rolesToAdd) {
    try {
      await member.roles.add(role);
      addedRoleIds.push(role.id);
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) {
    throw new AggregateError(failures, `Could not restore ${failures.length} role(s) for member ${userId}.`);
  }
  return addedRoleIds;
}

module.exports = { getMemberRoleSnapshot, restoreMemberRoles, setVoidedRole };