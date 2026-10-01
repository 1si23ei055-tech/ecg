import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { Device } from "@/lib/db/models";
import { getSession } from "@/lib/auth/session";
import { normalizeDeviceId } from "@/lib/ecg/device-id";

type Props = { params: Promise<{ deviceId: string }> };

export default async function DeviceDeepLinkPage({ params }: Props) {
  const { deviceId } = await params;
  await connectDb();
  const session = await getSession();

  const normalizedId = normalizeDeviceId(decodeURIComponent(deviceId));

  const device = await Device.findOne({
    deviceId: normalizedId,
  }).lean();

  const target = device
    ? `/dashboard?patient=${device.patientId}`
    : "/dashboard";

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(target)}`);
  }

  redirect(target);
}
