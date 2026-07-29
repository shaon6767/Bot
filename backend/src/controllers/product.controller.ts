import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Product } from "../models/Product.js";

export async function getProducts(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const products = await Product.find({ businessId: req.businessId }).sort({
    createdAt: -1,
  });
  res.json(products);
}

export async function createProduct(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { name, price } = req.body;
  const product = await Product.create({
    businessId: req.businessId,
    name,
    price,
  });
  res.status(201).json(product);
}

export async function updateProduct(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { name, price } = req.body;

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, businessId: req.businessId },
    {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
    },
    { new: true, runValidators: true },
  );

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json(product);
}

export async function deleteProduct(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    businessId: req.businessId,
  });

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.status(204).send();
}
