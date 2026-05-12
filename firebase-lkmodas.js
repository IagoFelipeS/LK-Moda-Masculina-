/* ================================================================
   LK MODAS — Firebase Integration
   SDK compat (9.x) — funciona com CDN sem bundler
================================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCkNca4mvZKesxswhXr_ybEjNmx3VgNQ_c",
  authDomain:        "lk-modas-7c7b8.firebaseapp.com",
  projectId:         "lk-modas-7c7b8",
  storageBucket:     "lk-modas-7c7b8.firebasestorage.app",
  messagingSenderId: "400450696248",
  appId:             "1:400450696248:web:260e2b7f7fed22844ee2cd",
};

/*
  REGRAS DO FIRESTORE — cole no Console Firebase → Firestore → Regras:

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if false;
      }
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /orders/{orderId} {
        allow create: if request.auth != null;
        allow read, update: if request.auth != null &&
          (resource.data.userId == request.auth.uid ||
           request.auth.token.email == 'lkmodamasculina089@gmail.com');
        allow delete: if request.auth != null &&
          request.auth.token.email == 'lkmodamasculina089@gmail.com';
      }
      match /products/{productId} {
        allow read: if true;
        allow write, delete: if request.auth != null &&
          request.auth.token.email == 'lkmodamasculina089@gmail.com';
      }
      match /admin_config/{docId} {
        allow read, write: if request.auth != null &&
          request.auth.token.email == 'lkmodamasculina089@gmail.com';
      }
      match /security_logs/{logId} {
        allow read, write: if request.auth != null &&
          request.auth.token.email == 'lkmodamasculina089@gmail.com';
      }
    }
  }
*/

(function () {
  'use strict';

  function waitForSDK(cb) {
    if (typeof firebase !== 'undefined' && firebase.firestore) cb();
    else setTimeout(() => waitForSDK(cb), 100);
  }

  waitForSDK(function () {
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

      const db   = firebase.firestore();
      const auth = firebase.auth();

      window.FB = {

        /* ── AUTH ───────────────────────────────────────── */
        async register(name, email, password) {
          try {
            const c = await auth.createUserWithEmailAndPassword(email, password);
            await c.user.updateProfile({ displayName: name });
            await db.collection('users').doc(c.user.uid).set({
              name, email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return { ok: true, user: c.user };
          } catch (err) {
            const msgs = {
              'auth/email-already-in-use': 'E-mail já cadastrado.',
              'auth/weak-password':        'Senha fraca (mínimo 6 caracteres).',
              'auth/invalid-email':        'E-mail inválido.',
            };
            return { ok: false, msg: msgs[err.code] || err.message };
          }
        },

        async login(email, password) {
          try {
            const c = await auth.signInWithEmailAndPassword(email, password);
            return { ok: true, user: c.user };
          } catch (err) {
            const msgs = {
              'auth/user-not-found':     'E-mail não encontrado.',
              'auth/wrong-password':     'Senha incorreta.',
              'auth/invalid-email':      'E-mail inválido.',
              'auth/too-many-requests':  'Muitas tentativas. Aguarde.',
              'auth/invalid-credential': 'E-mail ou senha incorretos.',
            };
            return { ok: false, msg: msgs[err.code] || 'Erro ao fazer login.' };
          }
        },

        /* Login silencioso para o admin — autentica no Firebase
           sem gravar lkmodas_session no localStorage */
        async loginAdmin(email, password) {
          try {
            const c = await auth.signInWithEmailAndPassword(email, password);
            return { ok: true, user: c.user };
          } catch (err) {
            return { ok: false, msg: err.message };
          }
        },

        async logout() {
          await auth.signOut();
          // Só redireciona — quem limpa a sessão é quem chama (admin ou site)
          const isAdmin = window.location.pathname.includes('admin');
          if (isAdmin) {
            window.location.href = 'admin.html';
          } else {
            try { localStorage.removeItem('lkmodas_session'); } catch {}
            window.location.href = 'index.html';
          }
        },

        async updatePassword(newPass) {
          try {
            if (!auth.currentUser) return { ok: false, msg: 'Não autenticado.' };
            await auth.currentUser.updatePassword(newPass);
            return { ok: true };
          } catch (err) {
            return { ok: false, msg: err.code === 'auth/requires-recent-login'
              ? 'Faça login novamente antes de alterar a senha.'
              : 'Falha ao atualizar senha.' };
          }
        },

        getCurrentUser() { return auth.currentUser; },
        onAuthChange(cb) { return auth.onAuthStateChanged(cb); },

        /* ── PRODUCTS ───────────────────────────────────── */
        async getProducts() {
          try {
            const snap = await db.collection('products').get();
            return snap.docs.map(d => ({ ...d.data(), id: d.id }));
          } catch (err) {
            console.error('getProducts erro:', err);
            return [];
          }
        },

        async saveProduct(product) {
          try {
            const id  = String(product.id || Date.now());
            const ref = db.collection('products').doc(id);
            const ex  = await ref.get();
            await ref.set({
              ...product, id,
              createdAt: ex.exists
                ? (ex.data().createdAt || firebase.firestore.FieldValue.serverTimestamp())
                : firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ Produto salvo no Firebase: ${id}`);
            
            // 📢 Notifica todas as abas abertas que há novo produto
            if (window.BroadcastChannel) {
              try {
                const channel = new BroadcastChannel('lkmodas-products');
                channel.postMessage({ type: 'product-added', id });
                channel.close();
              } catch (e) {
                console.warn('BroadcastChannel não disponível:', e);
              }
            }
            
            return { ok: true, id };
          } catch (err) {
            console.error('❌ saveProduct erro:', err);
            return { ok: false };
          }
        },

        async deleteProduct(id) {
          try {
            await db.collection('products').doc(String(id)).delete();
            return { ok: true };
          } catch (err) {
            console.error('deleteProduct erro:', err);
            return { ok: false };
          }
        },

        listenProducts(callback) {
          console.log('📡 Iniciando listener de produtos em tempo real...');
          return db.collection('products').onSnapshot(
            snap => {
              const products = snap.docs.map(d => ({ ...d.data(), id: d.id }));
              console.log(`✅ Listener recebeu ${products.length} produtos`);
              callback(products);
            },
            err  => {
              console.error('❌ listenProducts erro:', err);
              // Fallback: faz uma busca única se o listener falhar
              this.getProducts().then(p => {
                console.log(`⚠️ Fallback: carregando ${p.length} produtos`);
                callback(p);
              });
            }
          );
        },

        /* ── ORDERS ─────────────────────────────────────── */
        async saveOrder(order) {
          try {
            const user = auth.currentUser;
            await db.collection('orders').doc(order.id).set({
              ...order,
              userId:    user ? user.uid   : 'guest',
              userEmail: user ? user.email : (order.email || ''),
              status:    order.status || 'pending',
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return { ok: true };
          } catch (err) {
            console.error('saveOrder erro:', err);
            return { ok: false };
          }
        },

        async getOrder(orderId) {
          try {
            const snap = await db.collection('orders').doc(String(orderId)).get();
            return snap.exists ? { ...snap.data(), id: snap.id } : null;
          } catch { return null; }
        },

        async getAllOrders() {
          try {
            const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();
            return snap.docs.map(d => ({ ...d.data(), id: d.id }));
          } catch {
            try {
              const snap = await db.collection('orders').get();
              return snap.docs.map(d => ({ ...d.data(), id: d.id }));
            } catch (err) {
              console.error('getAllOrders erro:', err);
              return [];
            }
          }
        },

        async getOrdersByUser(userId) {
          try {
            const snap = await db.collection('orders')
              .where('userId', '==', userId)
              .orderBy('createdAt', 'desc').get();
            return snap.docs.map(d => ({ ...d.data(), id: d.id }));
          } catch {
            try {
              const snap = await db.collection('orders').where('userId', '==', userId).get();
              return snap.docs.map(d => ({ ...d.data(), id: d.id }));
            } catch (err) {
              console.error('getOrdersByUser erro:', err);
              return [];
            }
          }
        },

        async updateOrderStatus(orderId, status) {
          try {
            await db.collection('orders').doc(orderId).update({
              status, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return { ok: true };
          } catch (err) {
            console.error('updateOrderStatus erro:', err);
            return { ok: false };
          }
        },

        listenOrders(callback) {
          return db.collection('orders').onSnapshot(
            snap => callback(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
            err  => { console.error('listenOrders erro:', err); callback([]); }
          );
        },

        listenOrder(orderId, callback) {
          return db.collection('orders').doc(orderId).onSnapshot(
            snap => { if (snap.exists) callback({ ...snap.data(), id: snap.id }); },
            err  => console.error('listenOrder erro:', err)
          );
        },

        /* ── USER PROFILE ───────────────────────────────── */
        async getUserProfile(uid) {
          try {
            const snap = await db.collection('users').doc(uid).get();
            return snap.exists ? snap.data() : null;
          } catch { return null; }
        },

        async updateUserProfile(uid, data) {
          try {
            await db.collection('users').doc(uid).update({
              ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return { ok: true };
          } catch { return { ok: false }; }
        },
      };

      console.log('✅ Firebase LK Modas conectado!');
      window.dispatchEvent(new Event('firebase-ready'));

    } catch (err) {
      console.error('❌ Firebase init erro:', err);
    }
  });
})();