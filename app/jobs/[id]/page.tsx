export default function JobDetailsPage({ params }: { params: { id: string } }) {
  return <div>Job ID: {params.id}</div>;
}