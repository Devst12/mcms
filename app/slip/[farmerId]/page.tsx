import SlipClient from "@/components/SlipClient";

export default async function SlipPage({ params }: { params: Promise<{ farmerId: string }> }) {
  const { farmerId } = await params;
  return <SlipClient initialFarmerId={farmerId} />;
}
