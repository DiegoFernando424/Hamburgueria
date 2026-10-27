from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Burguer Art API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def populate_initial_data(db: Session):
    if db.query(models.ProductModel).count() == 0:
        initial_products = [
            models.ProductModel(
                name="Smash Master",
                description="2x smash burger 90g, queijo cheddar duplo, bacon crocante e maionese da casa no pão brioche.",
                price=28.90,
                category="burgers",
                image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
            ),
            models.ProductModel(
                name="Truffle Artisan",
                description="Hambúrguer 180g Angus, queijo brie derretido, cebola caramelizada e aioli trufado.",
                price=38.90,
                category="burgers",
                image="https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80"
            ),
            models.ProductModel(
                name="Fritas Rústicas com Cheddar e Bacon",
                description="Batatas cortadas à mão com casca, molho cheddar cremoso e farofa de bacon crocante.",
                price=18.50,
                category="sides",
                image="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80"
            ),
            models.ProductModel(
                name="Soda Artesanal de Frutas Vermelhas",
                description="Xarope natural de frutas vermelhas, água com gás e gelo com hortelã fresco.",
                price=12.00,
                category="drinks",
                image="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
            )
        ]
        db.add_all(initial_products)
        db.commit()

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    populate_initial_data(db)

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.ProductModel).all()

@app.post("/api/orders", response_model=schemas.OrderResponseSchema)
def create_order(order: schemas.OrderCreateSchema, db: Session = Depends(get_db)):
    db_order = models.OrderModel(
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        address=order.address,
        payment_method=order.payment_method,
        total_price=order.total_price
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order.items:
        db_item = models.OrderItemModel(
            order_id=db_order.id,
            product_name=item.product_name,
            quantity=item.quantity,
            price=item.price
        )
        db.add(db_item)
    
    db.commit()
    return db_order

@app.get("/api/orders", response_model=List[schemas.OrderResponseSchema])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.OrderModel).all()
