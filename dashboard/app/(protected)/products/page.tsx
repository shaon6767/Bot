import { ProductForm } from "@/components/ProductForm";
import { ProductList } from "@/components/ProductList";

export default function ProductsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">Products</h1>
      <ProductForm />
      <ProductList />
    </div>
  );
}
