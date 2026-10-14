const projectRefPattern = /^[a-z0-9]{20}$/;

type StagingTargetConfig = {
  databaseUrl: string | undefined;
  supabaseUrl: string | undefined;
  stagingProjectRef: string | undefined;
  productionProjectRef: string | undefined;
  storageBucket: string | undefined;
  stagingStorageBucket: string | undefined;
  productionStorageBucket: string | undefined;
};

function parseUrl(value: string | undefined) {
  if (!value) throw new Error("Staging target configuration is incomplete.");
  try {
    return new URL(value);
  } catch {
    throw new Error("Staging target configuration contains an invalid URL.");
  }
}

function projectRefFromSupabaseUrl(value: string | undefined) {
  const url = parseUrl(value);
  const match = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
  if (url.protocol !== "https:" || !match)
    throw new Error("Storage URL is not a standard Supabase project URL.");
  return match[1];
}

function projectRefFromDatabaseUrl(value: string | undefined) {
  const url = parseUrl(value);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:")
    throw new Error("Database URL is not PostgreSQL.");

  const hostMatch = url.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/);
  const isPoolerHost = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname);
  if (!hostMatch && !isPoolerHost)
    throw new Error("Database URL is not a recognized Supabase endpoint.");

  const username = decodeURIComponent(url.username);
  const userMatch = username.match(/(?:^|\.)([a-z0-9]{20})$/);
  const hostRef = hostMatch?.[1];
  const userRef = userMatch?.[1];

  if (isPoolerHost && !userRef)
    throw new Error("Pooler username does not identify a Supabase project.");

  if (hostRef && userRef && hostRef !== userRef)
    throw new Error("Database project identifiers do not match.");

  const projectRef = hostRef ?? userRef;
  if (!projectRef)
    throw new Error("Database URL does not identify a Supabase project.");
  return projectRef;
}

/** Validates project identity without connecting or revealing supplied URLs. */
export function assertIsolatedStagingTarget(config: StagingTargetConfig) {
  const { stagingProjectRef, productionProjectRef } = config;
  if (
    !stagingProjectRef ||
    !productionProjectRef ||
    !projectRefPattern.test(stagingProjectRef) ||
    !projectRefPattern.test(productionProjectRef) ||
    stagingProjectRef === productionProjectRef
  ) {
    throw new Error(
      "Distinct staging and production project refs are required.",
    );
  }

  const { storageBucket, stagingStorageBucket, productionStorageBucket } =
    config;
  if (
    !storageBucket ||
    !stagingStorageBucket ||
    !productionStorageBucket ||
    stagingStorageBucket === productionStorageBucket ||
    storageBucket !== stagingStorageBucket
  ) {
    throw new Error("A distinct staging Storage bucket is required.");
  }

  const storageRef = projectRefFromSupabaseUrl(config.supabaseUrl);
  const databaseRef = projectRefFromDatabaseUrl(config.databaseUrl);
  if (
    storageRef === productionProjectRef ||
    databaseRef === productionProjectRef ||
    storageRef !== stagingProjectRef ||
    databaseRef !== stagingProjectRef
  ) {
    throw new Error(
      "Configured database and storage are not the isolated staging project.",
    );
  }
}
