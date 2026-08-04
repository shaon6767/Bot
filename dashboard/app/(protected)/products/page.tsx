import { ProductForm } from "@/components/ProductForm";
import { ProductList } from "@/components/ProductList";

export default function ProductsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink mb-6">
        Products
      </h1>
      <ProductForm />
      <ProductList />
    </div>
  );
}
