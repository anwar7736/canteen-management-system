import PlatformShell from '../../../../components/platform/PlatformShell';
import PlatformTenantDetails from '../../../../components/platform/PlatformTenantDetails';

export default async function PlatformTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PlatformShell>
      <PlatformTenantDetails tenantId={id} />
    </PlatformShell>
  );
}
