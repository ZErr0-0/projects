import customtkinter as ctk
from tkinter import messagebox
from PIL import Image
import webbrowser

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Лента")
        self.geometry("436x767")
        self.resizable(False, False)

        self.background_image = ctk.CTkImage(Image.open("back.png"), size=(436, 767))
        self.product_images = {
            "Фрукты, овощи": ctk.CTkImage(Image.open("fruits.png"), size=(140, 100)),
            "Молочный отдел": ctk.CTkImage(Image.open("dairy.png"), size=(100, 100)),
            "Мясная лавка": ctk.CTkImage(Image.open("meat.png"), size=(140, 100)),
            "Выпечка": ctk.CTkImage(Image.open("bakery.png"), size=(140, 100))
        }
        self.discount_image = ctk.CTkImage(Image.open("snickers.png"), size=(100, 100))
        self.promo_image = ctk.CTkImage(Image.open("kinder.png"), size=(100, 100))

        self.cart = {}
        self.products_list = {
            "Фрукты, овощи": [
                {"name": "Яблоки", "quantity": "1 кг", "price": "100₽"},
                {"name": "Бананы", "quantity": "1 кг", "price": "80₽"},
                {"name": "Апельсины", "quantity": "1 кг", "price": "120₽"}
            ],
            "Молочный отдел": [
                {"name": "Молоко", "quantity": "1 л", "price": "60₽"},
                {"name": "Сыр", "quantity": "200 г", "price": "150₽"},
                {"name": "Йогурт", "quantity": "500 г", "price": "70₽"}
            ],
            "Мясная лавка": [
                {"name": "Курица", "quantity": "500 г", "price": "200₽"},
                {"name": "Говядина", "quantity": "500 г", "price": "300₽"},
                {"name": "Свинина", "quantity": "500 г", "price": "250₽"}
            ],
            "Выпечка": [
                {"name": "Хлеб", "quantity": "1 шт", "price": "30₽"},
                {"name": "Булка", "quantity": "1 шт", "price": "25₽"},
                {"name": "Круассан", "quantity": "1 шт", "price": "40₽"}
            ]
        }

        self.all_products = [
            product for category in self.products_list.values() for product in category
        ]
        self.all_products.append({"name": "Сникерс", "quantity": "1 шт", "price": "89.99₽"})
        self.all_products.append({"name": "Киндер", "quantity": "1 шт", "price": "150₽"})

        self.current_products = []

        self.create_main_screen()

    def create_main_screen(self):
        self.main_frame = ctk.CTkFrame(self, fg_color="#1f358b")
        self.main_frame.pack(fill="both", expand=True)

        background_label = ctk.CTkLabel(self.main_frame, image=self.background_image, text="")
        background_label.place(relx=0.5, rely=0.5, anchor="center")

        buttons = [
            ("Продукты", self.open_products_screen),
            ("Скидки и акции", self.open_discounts_screen),
            ("Корзина", self.open_cart_screen),
            ("Помощь", self.show_help_message),
            ("Выход", self.confirm_exit)
        ]

        y_position = 0.33
        for text, command in buttons:
            button = ctk.CTkButton(
                self.main_frame,
                text=text,
                font=("Arial", 18),
                corner_radius=50,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=250,
                height=50,
                command=command
            )
            button.place(relx=0.5, rely=y_position, anchor="center")
            y_position += 0.1

    def open_products_screen(self):
        self.main_frame.pack_forget()

        self.products_frame = ctk.CTkFrame(self, fg_color="#1f358b")
        self.products_frame.pack(fill="both", expand=True)

        back_button = ctk.CTkButton(
            self.products_frame,
            text="Назад",
            font=("Arial", 16),
            corner_radius=10,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=100,
            height=30,
            command=self.back_to_main_screen
        )
        back_button.place(relx=0.05, rely=0.05, anchor="nw")

        self.search_entry = ctk.CTkEntry(self.products_frame, placeholder_text="Поиск...", width=300)
        self.search_entry.place(relx=0.5, rely=0.2, anchor="center")
        self.search_entry.bind("<KeyRelease>", self.update_products_list)

        category_frame = ctk.CTkFrame(self.products_frame, fg_color="#1f358b")
        category_frame.place(relx=0.5, rely=0.5, anchor="center")

        for i, (text, image) in enumerate(self.product_images.items()):
            button = ctk.CTkButton(
                category_frame,
                text=text,
                image=image,
                font=("Arial", 16),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=150,
                height=150,
                compound="top",
                command=lambda t=text: self.show_category_products(t)
            )
            row = i // 2
            col = i % 2
            button.grid(row=row, column=col, padx=10, pady=10)

        cart_button = ctk.CTkButton(
            self.products_frame,
            text="Корзина",
            font=("Arial", 18),
            corner_radius=50,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=250,
            height=50,
            command=self.open_cart_screen
        )
        cart_button.place(relx=0.5, rely=0.9, anchor="center")

        self.products_frame.bind("<Button-1>", self.hide_products_list)

    def show_category_products(self, category):
        self.current_products = self.products_list[category]
        self.update_products_list(None)

    def update_products_list(self, event):
        if hasattr(self, 'products_canvas'):
            self.products_canvas.destroy()

        query = self.search_entry.get().lower() if event else ""

        self.products_canvas = ctk.CTkCanvas(self.products_frame, bg="#1f358b", width=300, height=300)
        self.products_canvas.place(relx=0.5, rely=0.43, anchor="center")

        y_position = 10
        products_to_show = self.current_products if not query else [
            product for product in self.all_products if query in product["name"].lower()
        ]

        for product in products_to_show:
            self.products_canvas.create_text(120, y_position,
                                             text=f"{product['name']} - {product['quantity']} | {product['price']}",
                                             fill="white", font=("Arial", 14))

            add_button = ctk.CTkButton(
                self.products_canvas,
                text="+",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda p=product["name"]: self.add_to_cart(p)
            )
            remove_button = ctk.CTkButton(
                self.products_canvas,
                text="-",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda p=product["name"]: self.remove_from_cart(p)
            )

            self.products_canvas.create_window((265, y_position - 8), window=add_button, anchor="ne")
            self.products_canvas.create_window((300, y_position + 14), window=remove_button, anchor="se")

            y_position += 40

        self.products_frame.bind("<Button-1>", self.check_click_outside)

    def check_click_outside(self, event):
        if hasattr(self, 'products_canvas'):
            try:
                canvas_coords = (
                    self.products_canvas.winfo_rootx(),
                    self.products_canvas.winfo_rooty(),
                    self.products_canvas.winfo_rootx() + self.products_canvas.winfo_width(),
                    self.products_canvas.winfo_rooty() + self.products_canvas.winfo_height()
                )

                if not (canvas_coords[0] <= event.x_root <= canvas_coords[2] and canvas_coords[1] <= event.y_root <=
                        canvas_coords[3]):
                    self.products_canvas.destroy()
                    self.products_frame.unbind("<Button-1>")
            except Exception as e:
                self.products_canvas.destroy()
                self.products_frame.unbind("<Button-1>")

    def hide_products_list(self, event):
        if hasattr(self, 'products_canvas') and not self.products_canvas.winfo_containing(event.x_root, event.y_root):
            self.products_canvas.destroy()
            self.products_frame.unbind("<Button-1>")

    def open_discounts_screen(self):
        self.main_frame.pack_forget()

        self.discounts_frame = ctk.CTkFrame(self, fg_color="#1f358b")
        self.discounts_frame.pack(fill="both", expand=True)

        back_button = ctk.CTkButton(
            self.discounts_frame,
            text="Назад",
            font=("Arial", 16),
            corner_radius=10,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=100,
            height=30,
            command=self.back_to_main_screen
        )
        back_button.place(relx=0.05, rely=0.05, anchor="nw")

        title_label = ctk.CTkLabel(self.discounts_frame, text="Скидки -25%", font=("Arial", 24, "bold"), text_color="white")
        title_label.place(relx=0.5, rely=0.15, anchor="center")

        discount_label = ctk.CTkLabel(self.discounts_frame, image=self.discount_image, text="SNIKERS\n89.99₽", compound="top", font=("Arial", 16), text_color="black", fg_color="#ffd600", corner_radius=10)
        discount_label.place(relx=0.5, rely=0.30, anchor="center")

        add_to_cart_button_snickers = ctk.CTkButton(
            self.discounts_frame,
            text="Добавить в корзину",
            font=("Arial", 14),
            corner_radius=10,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=150,
            height=30,
            command=lambda: self.add_to_cart("Сникерс")
        )
        add_to_cart_button_snickers.place(relx=0.5, rely=0.43, anchor="center")

        promo_label = ctk.CTkLabel(self.discounts_frame, text="Акция 1 + 1 Киндеры", font=("Arial", 24, "bold"), text_color="white")
        promo_label.place(relx=0.5, rely=0.55, anchor="center")

        promo_image_label1 = ctk.CTkLabel(self.discounts_frame, image=self.promo_image, text="", corner_radius=10)
        promo_image_label1.place(relx=0.25, rely=0.65, anchor="center")

        promo_image_label2 = ctk.CTkLabel(self.discounts_frame, image=self.promo_image, text="", corner_radius=10)
        promo_image_label2.place(relx=0.75, rely=0.65, anchor="center")

        add_to_cart_button_kinder = ctk.CTkButton(
            self.discounts_frame,
            text="Добавить в корзину",
            font=("Arial", 14),
            corner_radius=10,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=150,
            height=30,
            command=lambda: self.add_to_cart("Киндер", is_promo=True)
        )
        add_to_cart_button_kinder.place(relx=0.5, rely=0.83, anchor="center")

        plus_label = ctk.CTkLabel(self.discounts_frame, text="+", font=("Arial", 30, "bold"), text_color="white")
        plus_label.place(relx=0.5, rely=0.65, anchor="center")

        price_label = ctk.CTkLabel(self.discounts_frame, text="= 259,99₽", font=("Arial", 24, "bold"), text_color="white")
        price_label.place(relx=0.49, rely=0.75, anchor="center")

    def open_cart_screen(self):
        if hasattr(self, 'products_frame'):
            self.products_frame.pack_forget()
        if hasattr(self, 'discounts_frame'):
            self.discounts_frame.pack_forget()
        if hasattr(self, 'main_frame'):
            self.main_frame.pack_forget()

        self.cart_frame = ctk.CTkFrame(self, fg_color="#1f358b")
        self.cart_frame.pack(fill="both", expand=True)

        back_button = ctk.CTkButton(
            self.cart_frame,
            text="Назад",
            font=("Arial", 16),
            corner_radius=10,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=100,
            height=30,
            command=self.back_to_previous_screen
        )
        back_button.place(relx=0.05, rely=0.05, anchor="nw")

        cart_label = ctk.CTkLabel(self.cart_frame, text="Ваша корзина:", font=("Arial", 24, "bold"), text_color="white")
        cart_label.place(relx=0.5, rely=0.1, anchor="center")

# чтоб крутилось менюшка
        self.cart_scrollable_frame = ctk.CTkScrollableFrame(self.cart_frame, width=380, height=300)
        self.cart_scrollable_frame.place(relx=0.5, rely=0.5, anchor="center")

        self.cart_labels = {}
        for item, quantity in self.cart.items():
            price_text = f"{quantity['price']} за шт."
            if item == "Киндер" and quantity['count'] % 2 == 0:
                price_text = "259,99₽ за 2 шт."

            item_frame = ctk.CTkFrame(self.cart_scrollable_frame, fg_color="transparent")
            item_frame.pack(fill="x", pady=5)

            item_label = ctk.CTkLabel(item_frame, text=f"{item} - {quantity['quantity']} | {price_text}",
                                      font=("Arial", 18), text_color="white")
            item_label.grid(row=0, column=0, sticky="w")

            add_button = ctk.CTkButton(
                item_frame,
                text="+",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda i=item: self.increase_quantity(i)
            )
            remove_button = ctk.CTkButton(
                item_frame,
                text="-",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda i=item: self.decrease_quantity(i)
            )

            quantity_label = ctk.CTkLabel(item_frame, text=str(quantity['count']), font=("Arial", 18), text_color="white")
            quantity_label.grid(row=0, column=1, padx=10)

            add_button.grid(row=0, column=2, padx=5)
            remove_button.grid(row=0, column=3, padx=5)

            self.cart_labels[item] = {"item_label": item_label, "quantity_label": quantity_label}

        total_price = self.calculate_total_price()
        total_label = ctk.CTkLabel(self.cart_frame, text=f"Итого: {total_price:.2f}₽", font=("Arial", 20, "bold"),
                                   text_color="white")
        total_label.place(relx=0.5, rely=0.85, anchor="center")

        pay_button = ctk.CTkButton(
            self.cart_frame,
            text="Оплатить",
            font=("Arial", 18),
            corner_radius=50,
            fg_color="#ffd600",
            hover_color="orange",
            text_color="black",
            width=250,
            height=50,
            command=self.proceed_to_payment
        )
        pay_button.place(relx=0.5, rely=0.92, anchor="center")

    def add_to_cart(self, item_name, is_promo=False):
        for product in self.all_products:
            if product["name"] == item_name:
                if item_name in self.cart:
                    self.cart[item_name]['count'] += 1
                else:
                    self.cart[item_name] = {**product, 'count': 1}
                if is_promo and item_name == "Киндер":
                    self.cart[item_name]['count'] += 1  # Добавляем сразу 2 штуки для акции
                messagebox.showinfo("Корзина", f"{item_name} добавлен в корзину!")
                break

    def remove_from_cart(self, item_name):
        if item_name in self.cart and self.cart[item_name]['count'] > 1:
            self.cart[item_name]['count'] -= 1
            messagebox.showinfo("Корзина", f"Количество {item_name} уменьшено в корзине!")
        elif item_name in self.cart:
            del self.cart[item_name]
            messagebox.showinfo("Корзина", f"{item_name} удален из корзины!")
            self.update_cart_view()

    def increase_quantity(self, item_name):
        if item_name in self.cart:
            self.cart[item_name]['count'] += 1
            messagebox.showinfo("Корзина", f"Количество {item_name} увеличено в корзине!")
            self.cart_labels[item_name]["quantity_label"].configure(text=str(self.cart[item_name]['count']))
            self.update_total_price()

    def decrease_quantity(self, item_name):
        if item_name in self.cart:
            if self.cart[item_name]['count'] > 1:
                self.cart[item_name]['count'] -= 1
                messagebox.showinfo("Корзина", f"Количество {item_name} уменьшено в корзине!")
            else:
                del self.cart[item_name]
                messagebox.showinfo("Корзина", f"{item_name} удален из корзины!")
            self.update_cart_view()

    def update_cart_view(self):
        for label in self.cart_labels.values():
            label["item_label"].destroy()
            label["quantity_label"].destroy()

        for widget in self.cart_scrollable_frame.winfo_children():
            widget.destroy()

        self.cart_labels.clear()
        for item, quantity in self.cart.items():
            price_text = f"{quantity['price']} за шт."
            if item == "Киндер" and quantity['count'] % 2 == 0:
                price_text = "259,99₽ за 2 шт."

            item_frame = ctk.CTkFrame(self.cart_scrollable_frame, fg_color="transparent")
            item_frame.pack(fill="x", pady=5)

            item_label = ctk.CTkLabel(item_frame, text=f"{item} - {quantity['quantity']} | {price_text}",
                                      font=("Arial", 18), text_color="white")
            item_label.grid(row=0, column=0, sticky="w")

            add_button = ctk.CTkButton(
                item_frame,
                text="+",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda i=item: self.increase_quantity(i)
            )
            remove_button = ctk.CTkButton(
                item_frame,
                text="-",
                font=("Arial", 14),
                corner_radius=10,
                fg_color="#ffd600",
                hover_color="orange",
                text_color="black",
                width=30,
                height=20,
                command=lambda i=item: self.decrease_quantity(i)
            )

            quantity_label = ctk.CTkLabel(item_frame, text=str(quantity['count']), font=("Arial", 18),
                                          text_color="white")
            quantity_label.grid(row=0, column=1, padx=10)

            add_button.grid(row=0, column=2, padx=5)
            remove_button.grid(row=0, column=3, padx=5)

            self.cart_labels[item] = {"item_label": item_label, "quantity_label": quantity_label}

        self.update_total_price()

    def calculate_total_price(self):
        total_price = 0
        for item, quantity in self.cart.items():
            if item == "Киндер" and quantity['count'] % 2 == 0:
                total_price += (quantity['count'] // 2) * 259.99
            else:
                total_price += quantity['count'] * float(quantity['price'].replace('₽', '').replace(',', '.'))
        return total_price

    def update_total_price(self):
        total_price = self.calculate_total_price()
        total_label = ctk.CTkLabel(self.cart_frame, text=f"Итого: {total_price:.2f}₽", font=("Arial", 20, "bold"), text_color="white")
        total_label.place(relx=0.5, rely=0.85, anchor="center")

    def proceed_to_payment(self):
        webbrowser.open("https://example.com/payment")

    def back_to_previous_screen(self):
        if hasattr(self, 'products_frame'):
            self.cart_frame.pack_forget()
            self.products_frame.pack(fill="both", expand=True)
        elif hasattr(self, 'discounts_frame'):
            self.cart_frame.pack_forget()
            self.discounts_frame.pack(fill="both", expand=True)
        else:
            self.cart_frame.pack_forget()
            self.create_main_screen()

    def back_to_main_screen(self):
        if hasattr(self, 'products_frame'):
            self.products_frame.pack_forget()
        if hasattr(self, 'discounts_frame'):
            self.discounts_frame.pack_forget()
        if hasattr(self, 'cart_frame'):
            self.cart_frame.pack_forget()

        self.create_main_screen()

    def show_help_message(self):
        messagebox.showinfo(
            "Помощь",
            "Если у вас возникли вопросы, напишите нам письмо на адрес lentasupport@gmail.ru или по телефону +78005553535"
        )

    def confirm_exit(self):
        answer = messagebox.askquestion("Подтверждение", "Вы точно хотите выйти?")
        if answer == 'yes':
            self.destroy()

if __name__ == "__main__":
    app = App()
    app.mainloop()
