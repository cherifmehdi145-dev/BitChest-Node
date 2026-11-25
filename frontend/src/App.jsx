import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5101/api'

function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('bitchest_token') || ''
  )

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('bitchest_user') || 'null')
    } catch {
      return null
    }
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpMode, setSignUpMode] = useState(false)
  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [adminView, setAdminView] = useState('dashboard')
  const [clientView, setClientView] = useState('dashboard')
  const [clientMarketCryptoId, setClientMarketCryptoId] = useState('')
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [clientFirstName, setClientFirstName] = useState('')
  const [clientLastName, setClientLastName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientSaving, setClientSaving] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [temporaryPasswordClient, setTemporaryPasswordClient] = useState('')
  const [clientError, setClientError] = useState('')
  const [clientMessage, setClientMessage] = useState('')
  const [cryptos, setCryptos] = useState([])
  const [cryptosLoading, setCryptosLoading] = useState(false)
  const [cryptoFormOpen, setCryptoFormOpen] = useState(false)
  const [editingCrypto, setEditingCrypto] = useState(null)
  const [cryptoName, setCryptoName] = useState('')
  const [cryptoSymbol, setCryptoSymbol] = useState('')
  const [cryptoImageFilename, setCryptoImageFilename] = useState('')
  const [cryptoSaving, setCryptoSaving] = useState(false)
  const [cryptoError, setCryptoError] = useState('')
  const [cryptoMessage, setCryptoMessage] = useState('')
  const [confirmationDialog, setConfirmationDialog] = useState(null)
  const [confirmationLoading, setConfirmationLoading] = useState(false)
  const [selectedCryptoId, setSelectedCryptoId] = useState('')
  const [cryptoHistory, setCryptoHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  // Administrator quote form
  const [quoteCryptoId, setQuoteCryptoId] = useState('')
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteDate, setQuoteDate] = useState('')
  const [quoteSaving, setQuoteSaving] = useState(false)
  // Client wallet data
  const [walletData, setWalletData] = useState(null)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [walletMessage, setWalletMessage] = useState('')

  // Personal profile
const [profile, setProfile] = useState(null)
const [profileFirstName, setProfileFirstName] = useState('')
const [profileLastName, setProfileLastName] = useState('')
const [profileEmail, setProfileEmail] = useState('')
const [profileLoading, setProfileLoading] = useState(false)
const [profileSaving, setProfileSaving] = useState(false)
const [profileError, setProfileError] = useState('')
const [profileMessage, setProfileMessage] = useState('')
const [profileCurrentPassword, setProfileCurrentPassword] = useState('')
const [profileNewPassword, setProfileNewPassword] = useState('')
const [profileConfirmPassword, setProfileConfirmPassword] = useState('')
const [profilePasswordSaving, setProfilePasswordSaving] = useState(false)
const [profilePasswordError, setProfilePasswordError] = useState('')
const [profilePasswordMessage, setProfilePasswordMessage] = useState('')

  // Buy and sell form
  const [tradeCryptoId, setTradeCryptoId] = useState('')
  const [tradeType, setTradeType] = useState('BUY')
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeSaving, setTradeSaving] = useState(false)
  const [tradeConfirmation, setTradeConfirmation] = useState(null)
  
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')
  const mustChangePassword = user?.mustChangePassword === true

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'BitChest user'

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U'

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'The request could not be completed.')
    }

    return data
  }

  async function loadClients() {
    setClientsLoading(true)
    setClientError('')

    try {
      const data = await apiRequest('/users/clients')
      setClients(Array.isArray(data.clients) ? data.clients : [])
    } catch (err) {
      setClientError(err.message || 'Unable to load clients.')
    } finally {
      setClientsLoading(false)
    }
  }

async function handleProfilePasswordChange(event) {
  event.preventDefault()

  setProfilePasswordError('')
  setProfilePasswordMessage('')

  if (!profileCurrentPassword || !profileNewPassword || !profileConfirmPassword) {
    setProfilePasswordError('Please complete all password fields.')
    return
  }

  if (profileNewPassword !== profileConfirmPassword) {
    setProfilePasswordError('The new passwords do not match.')
    return
  }

  if (profileNewPassword.length < 8) {
    setProfilePasswordError('The new password must contain at least 8 characters.')
    return
  }

  setProfilePasswordSaving(true)

  try {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: profileCurrentPassword,
        newPassword: profileNewPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Unable to change the password.')
    }

    if (data.token) {
      sessionStorage.setItem('bitchest_token', data.token)
      setToken(data.token)
    }

    if (data.user) {
      sessionStorage.setItem('bitchest_user', JSON.stringify(data.user))
      setUser(data.user)
    }

    setProfileCurrentPassword('')
    setProfileNewPassword('')
    setProfileConfirmPassword('')
    setProfilePasswordMessage('Password changed successfully.')
  } catch (err) {
    setProfilePasswordError(
      err instanceof TypeError
        ? 'Cannot connect to the BitChest server. Make sure the backend is running.'
        : err.message
    )
  } finally {
    setProfilePasswordSaving(false)
  }
}
  async function loadProfile() {
  setProfileLoading(true)
  setProfileError('')
  setProfileMessage('')

  try {
    const data = await apiRequest('/users/me')
    const currentProfile = data.user

    setProfile(currentProfile)
    setProfileFirstName(currentProfile.firstName || '')
    setProfileLastName(currentProfile.lastName || '')
    setProfileEmail(currentProfile.email || '')
  } catch (err) {
    setProfileError(err.message || 'Unable to load your profile.')
  } finally {
    setProfileLoading(false)
  }
}

   async function loadCryptos() {
    setCryptosLoading(true)
    setCryptoError('')

    try {
      const data = await apiRequest('/cryptos')
      setCryptos(Array.isArray(data.cryptos) ? data.cryptos : [])
    } catch (err) {
      setCryptoError(err.message || 'Unable to load cryptocurrencies.')
    } finally {
      setCryptosLoading(false)
    }
  }
  async function loadCryptoHistory(cryptoId) {
    if (!cryptoId) {
      setCryptoHistory([])
      setHistoryError('')
      return
    }

    setHistoryLoading(true)
    setHistoryError('')

    try {
      const data = await apiRequest(`/cryptos/${cryptoId}/quotes`)
      setCryptoHistory(Array.isArray(data.quotes) ? data.quotes : [])
    } catch (err) {
      setCryptoHistory([])
      setHistoryError(err.message || 'Unable to load historical quotes.')
    } finally {
      setHistoryLoading(false)
    }
  }

    
   async function loadWalletData() {
    setWalletLoading(true)
    setWalletError('')

    try {
      const [wallet, transactions, cryptoData] = await Promise.all([
        apiRequest('/wallet'),
        apiRequest('/wallet/transactions'),
        apiRequest('/cryptos'),
      ])

      setWalletData(wallet)
      setWalletTransactions(
        Array.isArray(transactions.transactions)
          ? transactions.transactions
          : [],
      )

      const availableCryptos = Array.isArray(cryptoData.cryptos)
        ? cryptoData.cryptos
        : []

      setCryptos(availableCryptos)

      if (
        availableCryptos.length > 0 &&
        !availableCryptos.some(
          (crypto) => crypto.id === tradeCryptoId,
        )
      ) {
        setTradeCryptoId(availableCryptos[0].id)
      }
    } catch (err) {
      setWalletError(err.message || 'Unable to load your wallet.')
    } finally {
      setWalletLoading(false)
    }
  }

  useEffect(() => {
    if (token && user && !isAdmin && !mustChangePassword) {
      loadWalletData()
    }
  }, [token, user?.id, isAdmin, mustChangePassword])


  function openCryptoManagement() {
    setAdminView('cryptos')
    setMessage('')
    setCryptoError('')
    setCryptoMessage('')
    setCryptoFormOpen(false)
    loadCryptos()
  }

  function handleEditCrypto(crypto) {
  setEditingCrypto(crypto)
  setCryptoName(crypto.name || '')
  setCryptoSymbol(crypto.symbol || '')
  setCryptoImageFilename(crypto.imageFilename || '')
  setCryptoError('')
  setCryptoMessage('')
  setCryptoFormOpen(true)
 }

  async function handleCryptoSubmit(event) {
  event.preventDefault()
  setCryptoError('')
  setCryptoMessage('')
  setCryptoSaving(true)

  const payload = {
    name: cryptoName.trim(),
    symbol: cryptoSymbol.trim().toUpperCase(),
    imageFilename: cryptoImageFilename.trim() || null,
  }

  const isEditing = Boolean(editingCrypto)

  try {
    const data = await apiRequest(
      isEditing ? `/cryptos/${editingCrypto.id}` : '/cryptos',
      {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      },
    )

    setCryptoMessage(
      data.message ||
        (isEditing
          ? 'Cryptocurrency updated successfully.'
          : 'Cryptocurrency created successfully.'),
    )

    setCryptoName('')
    setCryptoSymbol('')
    setCryptoImageFilename('')
    setEditingCrypto(null)
    setCryptoFormOpen(false)

    await loadCryptos()
  } catch (err) {
    setCryptoError(
      err.message ||
        (isEditing
          ? 'Unable to update cryptocurrency.'
          : 'Unable to create cryptocurrency.'),
    )
  } finally {
    setCryptoSaving(false)
  }
}

async function confirmDeleteCrypto(crypto) {
  setCryptoError('')
  setCryptoMessage('')

  try {
    const data = await apiRequest(
      `/cryptos/${encodeURIComponent(crypto.id)}`,
      { method: 'DELETE' }
    )

    setCryptoMessage(
      data.message || 'Cryptocurrency deleted successfully.'
    )

    await loadCryptos()
  } catch (err) {
    setCryptoError(
      err.message || 'Unable to delete this cryptocurrency.'
    )
  }
}

function handleDeleteCrypto(crypto) {
  setConfirmationDialog({
    title: 'Delete cryptocurrency?',
    message: `Are you sure you want to delete ${crypto.name} (${crypto.symbol})? This action cannot be undone.`,
    confirmLabel: 'Yes, delete',
    onConfirm: () => confirmDeleteCrypto(crypto),
  })
}

    async function handleQuoteSubmit(event) {
    event.preventDefault()
    setCryptoError('')
    setCryptoMessage('')

    if (!quoteCryptoId) {
      setCryptoError('Please select a cryptocurrency.')
      return
    }

    const price = Number(quotePrice)

    if (!Number.isFinite(price) || price <= 0) {
      setCryptoError('The quote price must be greater than zero.')
      return
    }

    if (!quoteDate) {
      setCryptoError('Please select a quote date.')
      return
    }

    setQuoteSaving(true)

    try {
      const data = await apiRequest(
        `/cryptos/${quoteCryptoId}/quotes`,
        {
          method: 'POST',
          body: JSON.stringify({
            price: quotePrice,
            quoteDate,
          }),
        },
      )

      setCryptoMessage(
        data.message || 'Price quote added successfully.',
      )
      setQuotePrice('')
      setQuoteDate('')

      await loadCryptos()

      if (selectedCryptoId === quoteCryptoId) {
        await loadCryptoHistory(quoteCryptoId)
      }
    } catch (err) {
      setCryptoError(err.message || 'Unable to add the price quote.')
    } finally {
      setQuoteSaving(false)
    }
  }


  function openClientManagement() {
    setAdminView('clients')
    setMessage('')
    setClientMessage('')
    setClientError('')
    setTemporaryPassword('')
    setTemporaryPasswordClient('')
    setClientFormOpen(false)
    setEditingClient(null)
    loadClients()
  }

  function openDashboard() {
    setAdminView('dashboard')
    setMessage('')
    setClientError('')
    setClientMessage('')
    setTemporaryPassword('')
    setTemporaryPasswordClient('')
    setClientFormOpen(false)
    setEditingClient(null)
  }

  function resetClientForm() {
    setClientFirstName('')
    setClientLastName('')
    setClientEmail('')
    setEditingClient(null)
    setClientFormOpen(false)
  }

  function startCreateClient() {
    setClientError('')
    setClientMessage('')
    setTemporaryPassword('')
    setTemporaryPasswordClient('')
    setEditingClient(null)
    setClientFirstName('')
    setClientLastName('')
    setClientEmail('')
    setClientFormOpen(true)
  }

  function startEditClient(client) {
    setClientError('')
    setClientMessage('')
    setTemporaryPassword('')
    setTemporaryPasswordClient('')
    setEditingClient(client)
    setClientFirstName(client.firstName || '')
    setClientLastName(client.lastName || '')
    setClientEmail(client.email || '')
    setClientFormOpen(true)
  }

  async function handleClientSubmit(event) {
    event.preventDefault()
    setClientError('')
    setClientMessage('')
    setClientSaving(true)

    const payload = {
  firstName: clientFirstName.trim(),
  lastName: clientLastName.trim(),
}

    try {
      if (editingClient) {
        const data = await apiRequest(
          `/users/clients/${encodeURIComponent(editingClient.id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          }
        )

        setClientMessage(data.message || 'Client updated successfully.')
        resetClientForm()
        await loadClients()
      } else {
        const data = await apiRequest('/users/clients', {
  method: 'POST',
  body: JSON.stringify({
    ...payload,
    email: clientEmail.trim(),
  }),
})

        setTemporaryPassword(data.temporaryPassword || '')
        setTemporaryPasswordClient(
          [data.client?.firstName, data.client?.lastName]
            .filter(Boolean)
            .join(' ') || clientEmail.trim()
        )
        setClientMessage(data.message || 'Client created successfully.')
        resetClientForm()
        await loadClients()
      }
    } catch (err) {
      setClientError(err.message || 'Unable to save this client.')
    } finally {
      setClientSaving(false)
    }
  }
   
  async function confirmDeactivateClient(client) {
  setClientError('')
  setClientMessage('')
  setTemporaryPassword('')
  setTemporaryPasswordClient('')

  try {
    const data = await apiRequest(
      `/users/clients/${encodeURIComponent(client.id)}`,
      { method: 'DELETE' }
    )

    setClientMessage(
      data.message ||
        'Client account successfully removed from active management. Financial records preserved.'
    )

    await loadClients()
  } catch (err) {
    setClientError(
      err.message || 'Unable to remove this client account.'
    )
  }
}

function handleDeactivateClient(client) {
  setConfirmationDialog({
    title: 'Remove client?',
    message: `Are you sure you want to remove ${client.firstName} ${client.lastName} (${client.email}) from active clients? Their access will be revoked, but their wallet and transaction history will be preserved.`,
    confirmLabel: 'Remove client',
    onConfirm: () => confirmDeactivateClient(client),
  })
}

  async function handleProfileSubmit(event) {
  event.preventDefault()
  setProfileError('')
  setProfileMessage('')

  setProfileSaving(true)

  try {
    const data = await apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: profileFirstName,
        lastName: profileLastName,
        
      }),
    })

    setProfile(data.user)
    setUser((previousUser) => {
      const updatedUser = { ...previousUser, ...data.user }

      sessionStorage.setItem(
        'bitchest_user',
        JSON.stringify(updatedUser)
      )

      return updatedUser
    })

    setProfileMessage(data.message || 'Profile updated successfully.')
  } catch (err) {
    setProfileError(err.message || 'Unable to update your profile.')
  } finally {
    setProfileSaving(false)
  }
}

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in.')
      }

      sessionStorage.setItem('bitchest_token', data.token)
      sessionStorage.setItem('bitchest_user', JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)
      setPassword('')
      setAdminView('dashboard')
      setMessage(data.message || 'Login successful.')
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to the BitChest server. Make sure the backend is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
  event.preventDefault()
  setError('')
  setMessage('')

  if (
    !signUpFirstName.trim() ||
    !signUpLastName.trim() ||
    !email.trim() ||
    !password
  ) {
    setError('Please complete all fields.')
    return
  }

  if (password.length < 8) {
    setError('Password must contain at least 8 characters.')
    return
  }

  if (password !== signUpConfirmPassword) {
    setError('The passwords do not match.')
    return
  }

  setLoading(true)

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: signUpFirstName.trim(),
        lastName: signUpLastName.trim(),
        email: email.trim(),
        password,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Unable to create your account.')
    }

    setSignUpMode(false)
    setSignUpFirstName('')
    setSignUpLastName('')
    setSignUpConfirmPassword('')
    setPassword('')
    setMessage(data.message || 'Account created successfully. You can now sign in.')
  } catch (err) {
    setError(
      err instanceof TypeError
        ? 'Cannot connect to the BitChest server. Make sure the backend is running.'
        : err.message
    )
  } finally {
    setLoading(false)
  }
}

  async function handlePasswordChange(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('The new password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to change the password.')
      }

      if (data.token) {
        sessionStorage.setItem('bitchest_token', data.token)
        setToken(data.token)
      }

      if (data.user) {
        sessionStorage.setItem('bitchest_user', JSON.stringify(data.user))
        setUser(data.user)
      } else {
        const updatedUser = { ...user, mustChangePassword: false }
        sessionStorage.setItem('bitchest_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password changed successfully.')
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to the BitChest server. Make sure the backend is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('bitchest_token')
    sessionStorage.removeItem('bitchest_user')

    setToken('')
    setUser(null)
    setEmail('')
    setPassword('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('')
    setError('')
    setAdminView('dashboard')
    setClients([])
    setClientSearch('')
    setClientError('')
    setClientMessage('')
    setTemporaryPassword('')
    setTemporaryPasswordClient('')
    resetClientForm()
  }

  function renderBrandPanel() {
    return (
      <section className="brand-panel">
        <div className="brand-top">
          <img
            className="brand-logo"
            src="/images/bitchest_logo.png"
            alt="BitChest logo"
          />

          <div>
            <div className="brand-name">
              Bit<span>Chest</span>
            </div>
            <p className="brand-tagline">Your crypto space</p>
          </div>
        </div>

        <div className="brand-middle">
          <div className="brand-accent" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <h2>
            Manage your crypto.
            <br />
            <span>Your way.</span>
          </h2>

          <p>
            A clear and simple space to explore cryptocurrency prices, manage
            your wallet, and follow your portfolio.
          </p>
        </div>

        <p className="brand-footer">
          BitChest &copy; {new Date().getFullYear()} - Cryptocurrency exchange
          prototype
        </p>
      </section>
    )
  }

  function renderLogin() {
  return (
    <main className="login-page">
      <div className="login-layout">
        {renderBrandPanel()}

        <section className="form-panel">
          <div className="form-content">
            <p className="eyebrow">
              {signUpMode ? 'Join BitChest' : 'Welcome back'}
            </p>

            <h1>{signUpMode ? 'Create an account' : 'Sign in'}</h1>

            <p className="form-subtitle">
              {signUpMode
                ? 'Create your BitChest account and start exploring cryptocurrency.'
                : 'Enter your account details to access your BitChest space.'}
            </p>

            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="alert alert-success" role="status">
                {message}
              </div>
            )}

            {signUpMode ? (
              <form onSubmit={handleRegister}>
                <div className="form-field">
                  <label htmlFor="signUpFirstName">First name</label>
                  <input
                    id="signUpFirstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    maxLength={100}
                    value={signUpFirstName}
                    onChange={(event) => setSignUpFirstName(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="signUpLastName">Last name</label>
                  <input
                    id="signUpLastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Your last name"
                    maxLength={100}
                    value={signUpLastName}
                    onChange={(event) => setSignUpLastName(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="signUpEmail">Email address</label>
                  <input
                    id="signUpEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="signUpPassword">Password</label>
                  <input
                    id="signUpPassword"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="signUpConfirmPassword">
                    Confirm password
                  </label>
                  <input
                    id="signUpConfirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    minLength={8}
                    value={signUpConfirmPassword}
                    onChange={(event) =>
                      setSignUpConfirmPassword(event.target.value)
                    }
                    required
                  />
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create my account'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <div className="form-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in to BitChest'}
                </button>
              </form>
            )}

            <p className="auth-switch">
              {signUpMode
                ? 'Already have an account?'
                : "Don't have an account yet?"}{' '}
              <button
                type="button"
                className="auth-switch-button"
                onClick={() => {
                  setSignUpMode(!signUpMode)
                  setError('')
                  setMessage('')
                  setPassword('')
                  setSignUpConfirmPassword('')
                }}
              >
                {signUpMode ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            <p className="form-note">
              {signUpMode
                ? 'Your account will be created as a client account with an initial balance of €500.'
                : 'Keep your account credentials private and secure.'}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}       

              

  function renderPasswordChange() {
    return (
      <main className="login-page">
        <div className="login-layout">
          {renderBrandPanel()}

          <section className="form-panel">
            <div className="form-content">
              <p className="eyebrow">Account security</p>
              <h1>Change your password</h1>

              <p className="form-subtitle">
                You must choose a new password before accessing your account.
              </p>

              {error && (
                <div className="alert alert-error" role="alert">
                  {error}
                </div>
              )}

              {message && (
                <div className="alert alert-success" role="status">
                  {message}
                </div>
              )}

              <form onSubmit={handlePasswordChange}>
                <div className="form-field">
                  <label htmlFor="currentPassword">Current password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Change password'}
                </button>
              </form>

              <button
                className="text-button"
                type="button"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  function renderAdminSidebar() {
    return (
      <aside className="admin-sidebar">
        <button
          className="admin-brand admin-brand-button"
          type="button"
          onClick={openDashboard}
          aria-label="BitChest dashboard"
        >
          <span className="admin-brand-icon">B</span>
          <span>
            Bit<span>Chest</span>
          </span>
        </button>

        <div className="admin-sidebar-label">WORKSPACE</div>

        <nav className="admin-sidebar-nav" aria-label="Administrator navigation">
          <button
            className={`admin-nav-item ${adminView === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={openDashboard}
            aria-current={adminView === 'dashboard' ? 'page' : undefined}
          >
            <span className="admin-nav-icon">D</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-nav-item ${adminView === 'clients' ? 'active' : ''}`}
            type="button"
            onClick={openClientManagement}
            aria-current={adminView === 'clients' ? 'page' : undefined}
          >
            <span className="admin-nav-icon">C</span>
            <span>Client management</span>
          </button>

          <button
  className={`admin-nav-item ${adminView === 'cryptos' ? 'active' : ''}`}
  type="button"
  onClick={openCryptoManagement}
  aria-current={adminView === 'cryptos' ? 'page' : undefined}
>
  <span className="admin-nav-icon">M</span>
  <span>Crypto market</span>
</button>

<button
  className={`admin-nav-item ${adminView === 'profile' ? 'active' : ''}`}
  type="button"
  onClick={() => {
  setAdminView('profile')
  loadProfile()
}}
  aria-current={adminView === 'profile' ? 'page' : undefined}
>
  <span className="admin-nav-icon">P</span>
  <span>My profile</span>
</button>

        </nav>

        <div className="admin-sidebar-divider" />

        <div className="admin-sidebar-label">PLATFORM</div>

        <div className="admin-sidebar-note">
          <div className="admin-note-title">BitChest prototype</div>
          <p>
            Academic demonstration environment. Cryptocurrency quotes and
            trading activity are simulated.
          </p>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <div className="admin-note-title">Administrator access</div>
            <p>
              Your account is signed in to the BitChest administration
              workspace.
            </p>
          </div>
        </div>
      </aside>
    )
  }

  function renderClientSidebar() {
  const clientNavigation = [
    { id: 'dashboard', label: 'Dashboard', icon: 'D' },
    { id: 'wallet', label: 'My wallet', icon: 'W' },
    { id: 'market', label: 'Crypto market', icon: 'M' },
    { id: 'profile', label: 'My profile', icon: 'P' },
  ]

  return (
    <aside className="admin-sidebar">
      <button
        className="admin-brand admin-brand-button"
        type="button"
        onClick={() => setClientView('dashboard')}
        aria-label="BitChest dashboard"
      >
        <span className="admin-brand-icon">B</span>
        <span>
          Bit<span>Chest</span>
        </span>
      </button>

      <div className="admin-sidebar-label">WORKSPACE</div>

      <nav className="admin-sidebar-nav" aria-label="Client navigation">
        {clientNavigation.map((item) => (
          <button
            key={item.id}
            className={`admin-nav-item ${
              clientView === item.id ? 'active' : ''
            }`}
            type="button"
            onClick={() => {
              setClientView(item.id)

              if (item.id === 'wallet' || item.id === 'dashboard') {
                loadWalletData()
              }

              if (item.id === 'profile') {
                loadProfile()
              }

              if (item.id === 'market') {
                loadCryptos()
              }
            }}
            aria-current={clientView === item.id ? 'page' : undefined}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-divider" />

      <div className="admin-sidebar-label">PLATFORM</div>

      <div className="admin-sidebar-note">
        <div className="admin-note-title">BitChest prototype</div>
        <p>
          Academic demonstration environment. Cryptocurrency quotes and
          trading activity are simulated.
        </p>
      </div>

      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-note">
          <div className="admin-note-title">Client access</div>
          <p>
            Your personal cryptocurrency portfolio and trading workspace.
          </p>
        </div>

        <button
          className="admin-nav-item"
          type="button"
          onClick={handleLogout}
        >
          <span className="admin-nav-icon">↪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

  function renderAdminTopbar() {
    return (
      <header className="admin-topbar">
        <div className="admin-topbar-heading">
          <div className="admin-topbar-title">Administration</div>
          <div className="admin-topbar-caption">
            Platform overview and management
          </div>
        </div>

        <div className="admin-topbar-account">
          <div className="admin-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="admin-account-details">
            <div className="admin-account-role">Administrator</div>
            <span className="admin-account-email">{user?.email}</span>
          </div>

          <button
            className="admin-logout-button"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>
    )
  }

  function renderAdminDashboard() {
    return (
      <section className="admin-content" id="dashboard">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Administration workspace</p>
            <h1>Dashboard</h1>
            <p className="admin-page-subtitle">
              Welcome back. Manage your platform and monitor the available
              cryptocurrency services.
            </p>
          </div>

          <div className="admin-active-badge">
  <span />
  {isAdmin ? 'Administrator account' : 'Client account'}
</div>
        </div>

        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}

        <section className="admin-welcome-panel">
          <div className="admin-welcome-content">
            <div className="admin-welcome-label">BITCHEST / ADMINISTRATION</div>
            <h2>Welcome to your workspace</h2>
            <p>
              Manage client accounts, explore the cryptocurrency market, and
              oversee the features available in this academic prototype.
            </p>

            <div className="admin-welcome-actions">
              <button
                className="admin-primary-action"
                type="button"
                onClick={openClientManagement}
              >
                Manage clients
              </button>
              <span className="admin-secondary-action">
                Crypto market - next step
              </span>
            </div>
          </div>
        </section>

        <div className="admin-section-heading">
          <h2>Platform overview</h2>
          <span>Available features</span>
        </div>

        <div className="admin-overview-grid">
          <button
            className="admin-overview-card admin-overview-card-button"
            type="button"
            onClick={openClientManagement}
          >
            <div className="admin-card-top">
              <div className="admin-card-icon">C</div>
              <span className="admin-card-type">Management</span>
            </div>
            <h3>Client management</h3>
            <p>
              Create client accounts, update their details, and manage account
              access.
            </p>
            <div className="admin-card-action">
              <span>Open client management</span>
              <span>-&gt;</span>
            </div>
          </button>

          <article className="admin-overview-card">
            <div className="admin-card-top">
              <div className="admin-card-icon blue">M</div>
              <span className="admin-card-type">Market</span>
            </div>
            <h3>Cryptocurrency market</h3>
            <p>
              Explore supported cryptocurrencies, simulated prices, and
              historical charts.
            </p>
            <div className="admin-card-action">
              <span>Frontend connection pending</span>
              <span>-&gt;</span>
            </div>
          </article>

          <article className="admin-overview-card">
            <div className="admin-card-top">
              <div className="admin-card-icon purple">H</div>
              <span className="admin-card-type">Data</span>
            </div>
            <h3>Historical quotes</h3>
            <p>
              Simulated historical quote records support market charts and
              price-change demonstrations.
            </p>
            <div className="admin-card-action">
              <span>Market data feature</span>
              <span>OK</span>
            </div>
          </article>
        </div>

        <aside className="admin-prototype-notice">
          <div className="admin-notice-icon">i</div>
          <div>
            <div className="admin-notice-title">Academic prototype notice</div>
            <p>
              BitChest is a demonstration application. Cryptocurrency prices
              and transactions are simulated. No real cryptocurrency purchases,
              sales, or transfers take place.
            </p>
          </div>
        </aside>

        <footer className="admin-footer">
          <span>Copyright {new Date().getFullYear()} BitChest</span>
          <span>Academic prototype - Administration workspace</span>
        </footer>
      </section>
    )
  }

  function renderClientManagement() {
    const normalizedSearch = clientSearch.trim().toLowerCase()

    const filteredClients = clients.filter((client) => {
      const searchableText = [
        client.firstName,
        client.lastName,
        client.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })

    return (
      <section
  id="admin-client-management"
  className="admin-content client-management-content"
>
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Administration workspace</p>
            <h1>Client management</h1>
            <p className="admin-page-subtitle">
              Create client accounts, search existing clients, update their
details, and remove accounts from active management.
            </p>
          </div>

          <div className="admin-active-badge">
  <span />
  {isAdmin ? 'Administrator account' : 'Client account'}
</div>
        </div>

        {clientError && (
          <div className="alert alert-error" role="alert">
            {clientError}
          </div>
        )}

        {clientMessage && (
          <div className="alert alert-success" role="status">
            {clientMessage}
          </div>
        )}

        {temporaryPassword && (
          <section className="temporary-password-panel">
            <h2>Client account created</h2>
            <p>
              A temporary password has been generated for{' '}
              <strong>{temporaryPasswordClient}</strong>.
            </p>
            <p>
              Provide it to the client securely. They must change it before
              accessing their account. This password is not saved in browser
              storage.
            </p>
            <label htmlFor="generatedTemporaryPassword">
              Temporary password
            </label>
            <div className="temporary-password-row">
              <input
                id="generatedTemporaryPassword"
                type="text"
                value={temporaryPassword}
                readOnly
                autoComplete="off"
              />
              <button
                className="client-secondary-button"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(temporaryPassword).catch(() => {
                    setClientError(
                      'Clipboard access was unavailable. Select and copy the password manually.'
                    )
                  })
                }}
              >
                Copy password
              </button>
              <button
                className="client-secondary-button"
                type="button"
                onClick={() => {
                  setTemporaryPassword('')
                  setTemporaryPasswordClient('')
                }}
              >
                Hide password
              </button>
            </div>
          </section>
        )}

        {clientFormOpen && (
  <section className="client-form-panel">

            <div className="client-panel-heading">
              <div>
                <p className="admin-eyebrow">
                  {editingClient ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}
                </p>
                <h2>{editingClient ? 'Edit client' : 'Create client'}</h2>
              </div>
              <button
                className="client-secondary-button"
                type="button"
                onClick={resetClientForm}
                disabled={clientSaving}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleClientSubmit}>
              <div className="client-form-grid">
                <div className="form-field">
                  <label htmlFor="clientFirstName">First name</label>
                  <input
                    id="clientFirstName"
                    type="text"
                    maxLength={100}
                    value={clientFirstName}
                    onChange={(event) => setClientFirstName(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="clientLastName">Last name</label>
                  <input
                    id="clientLastName"
                    type="text"
                    maxLength={100}
                    value={clientLastName}
                    onChange={(event) => setClientLastName(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field client-form-email">
                  <label htmlFor="clientEmail">Email address</label>
                  <input
  id="clientEmail"
  type="email"
  maxLength={254}
  autoComplete="off"
  placeholder="client@example.com"
  value={clientEmail}
onChange={(event) => setClientEmail(event.target.value)}
readOnly={!!editingClient}
/>
                </div>
              </div>

              {!editingClient && (
                <p className="client-form-note">
                  A temporary password will be generated automatically.
                </p>
              )}

              <button
                className="admin-primary-action client-submit-button"
                type="submit"
                disabled={clientSaving}
              >
                {clientSaving
                  ? 'Saving...'
                  : editingClient
                    ? 'Save changes'
                    : 'Create client'}
              </button>
            </form>
          </section>
        )}

<section className="client-list-panel">
              <div className="client-list-heading">
            <div>
              <h2>Client accounts</h2>
              <p>
                {clientsLoading
                  ? 'Loading accounts...'
                  : `${filteredClients.length} client${filteredClients.length === 1 ? '' : 's'} shown`}
              </p>
            </div>

            <div className="client-list-actions">
              <button
                className="client-secondary-button"
                type="button"
                onClick={loadClients}
                disabled={clientsLoading}
              >
                {clientsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="admin-primary-action"
                type="button"
                onClick={startCreateClient}
              >
                + Create client
              </button>
            </div>
          </div>

          <div className="client-search">
            <label htmlFor="clientSearch">Search clients</label>
            <input
              id="clientSearch"
              type="search"
              placeholder="Search by name or email..."
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
            />
          </div>

          {clientsLoading ? (
            <div className="client-empty-state">Loading client accounts...</div>
          ) : filteredClients.length === 0 ? (
            <div className="client-empty-state">
              {clients.length === 0
                ? 'No active client accounts were found.'
                : 'No clients match your search.'}
            </div>
          ) : (
            <div className="client-table-wrapper">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Euro balance</th>
                    <th>Account</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <strong>
                          {[client.firstName, client.lastName]
                            .filter(Boolean)
                            .join(' ')}
                        </strong>
                      </td>
                      <td>{client.email}</td>
                      <td>
                        {client.euroBalance != null
                          ? `${Number(client.euroBalance).toLocaleString(
                              'en-GB',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )} EUR`
                          : 'Not available'}
                      </td>
                      <td>
                        <span
                          className={`client-status ${
                            client.isActive ? 'client-status-active' : 'client-status-inactive'
                          }`}
                        >
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {client.mustChangePassword && (
                          <span className="client-password-status">
                            Password change required
                          </span>
                        )}
                      </td>



                      <td>
                        <div className="client-row-actions">
                          <button
                            className="client-edit-button"
                            type="button"
                            onClick={() => startEditClient(client)}
                          >
                            Edit
                          </button>

                          


                          
                          <button
                            className="client-deactivate-button"
                            type="button"
                            onClick={() => handleDeactivateClient(client)}
                            disabled={!client.isActive}
                          >
                            Remove account
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
         
         
         
        <footer className="admin-footer">
          <span>Copyright {new Date().getFullYear()} BitChest</span>
          <span>Client management - Administration workspace</span>
        </footer>
      </section>
    )
  }

    function renderProfileManagement() {
    return (
      <section id="admin-profile-management" className="admin-content client-management-content">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Account settings</p>
            <h1>My profile</h1>
            <p className="admin-page-subtitle">
              View and update your personal account details.
            </p>
          </div>

          <div className="admin-active-badge">
  <span />
  {isAdmin ? 'Administrator account' : 'Client account'}
</div>
        </div>

        {profileError && (
          <div className="alert alert-error" role="alert">
            {profileError}
          </div>
        )}

        {profileMessage && (
          <div className="alert alert-success" role="status">
            {profileMessage}
          </div>
        )}

        <section className="client-form-panel">
          <div className="client-panel-heading">
            <div>
              <p className="admin-eyebrow">PERSONAL INFORMATION</p>
              <h2>Account details</h2>
            </div>
          </div>

          {profileLoading ? (
            <p>Loading your profile...</p>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div className="client-form-grid">
                <div className="form-field">
                  <label htmlFor="profileFirstName">First name</label>
                  <input
                    id="profileFirstName"
                    type="text"
                    maxLength={100}
                    value={profileFirstName}
                    onChange={(event) =>
                      setProfileFirstName(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="profileLastName">Last name</label>
                  <input
                    id="profileLastName"
                    type="text"
                    maxLength={100}
                    value={profileLastName}
                    onChange={(event) =>
                      setProfileLastName(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-field client-form-email profile-email-field">
  <label htmlFor="profileEmail">Email address</label>

  <div className="profile-email-control">
    <input
      id="profileEmail"
      type="email"
      maxLength={254}
      value={profileEmail}
      readOnly
      required
      aria-describedby="profileEmailHint"
    />

    <span className="profile-email-badge">
      <span aria-hidden="true">🔒</span>
      Read-only
    </span>
  </div>

  <p className="profile-email-hint" id="profileEmailHint">
    Your email address is linked to your account and cannot be changed here.
  </p>
</div>
              </div>

              <button
                className="admin-primary-action client-submit-button"
                type="submit"
                disabled={profileSaving || profileLoading}
              >
                {profileSaving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          )}
        </section>
        
        <section className="client-form-panel">
          <div className="client-panel-heading">
            <div>
              <p className="admin-eyebrow">SECURITY</p>
              <h2>Change password</h2>
              <p className="admin-page-subtitle">
                Update your account password.
              </p>
            </div>
          </div>

          {profilePasswordError && (
            <div className="alert alert-error" role="alert">
              {profilePasswordError}
            </div>
          )}

          {profilePasswordMessage && (
            <div className="alert alert-success" role="status">
              {profilePasswordMessage}
            </div>
          )}

          <form onSubmit={handleProfilePasswordChange}>
            <div className="client-form-grid">
              <div className="form-field">
                <label htmlFor="profileCurrentPassword">
                  Current password
                </label>
                <input
                  id="profileCurrentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={profileCurrentPassword}
                  onChange={(event) =>
                    setProfileCurrentPassword(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="profileNewPassword">
                  New password
                </label>
                <input
                  id="profileNewPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={profileNewPassword}
                  onChange={(event) =>
                    setProfileNewPassword(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="profileConfirmPassword">
                  Confirm new password
                </label>
                <input
                  id="profileConfirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={profileConfirmPassword}
                  onChange={(event) =>
                    setProfileConfirmPassword(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <button
              className="admin-primary-action client-submit-button"
              type="submit"
              disabled={profilePasswordSaving}
            >
              {profilePasswordSaving
                ? 'Changing password...'
                : 'Change password'}
            </button>
          </form>
        </section>

        <footer className="admin-footer">
          <span>Copyright {new Date().getFullYear()} BitChest</span>
          <span>
  My profile - {isAdmin ? 'Administration workspace' : 'Client area'}
</span>
        </footer>
      </section>
    )
  }

  function renderCryptoManagement() {
    return (
<div id="admin-crypto-management" className="admin-content">
          <div className="admin-page-heading">
          <div>
            <h1>Crypto market</h1>
            <p>Manage the cryptocurrencies available on BitChest.</p>
          </div>

          <button
            type="button"
            className="client-submit-button"
            onClick={() => {
  setCryptoError('')
  setCryptoMessage('')

  if (cryptoFormOpen) {
    setCryptoFormOpen(false)
    setEditingCrypto(null)
    setCryptoName('')
    setCryptoSymbol('')
    setCryptoImageFilename('')
  } else {
    setEditingCrypto(null)
    setCryptoName('')
    setCryptoSymbol('')
    setCryptoImageFilename('')
    setCryptoFormOpen(true)
  }
}}
          >
            {cryptoFormOpen ? 'Cancel' : '+ Add cryptocurrency'}
          </button>
        </div>

        {cryptoError && (
          <div className="alert alert-error" role="alert">
            {cryptoError}
          </div>
        )}

        {cryptoMessage && (
          <div className="alert alert-success" role="status">
            {cryptoMessage}
          </div>
        )}

        {cryptoFormOpen && (
          <section className="client-form-panel">
            <div className="client-panel-heading">
            <h2>{editingCrypto ? 'Edit cryptocurrency' : 'Add cryptocurrency'}</h2>
            </div>

            <form onSubmit={handleCryptoSubmit}>
              <div className="client-form-grid">
                <div className="form-field">
                  <label htmlFor="crypto-name">Name</label>
                  <input
                    id="crypto-name"
                    type="text"
                    value={cryptoName}
                    onChange={(event) => setCryptoName(event.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="crypto-symbol">Symbol</label>
                  <input
                    id="crypto-symbol"
                    type="text"
                    value={cryptoSymbol}
                    onChange={(event) => setCryptoSymbol(event.target.value)}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="crypto-image">Image filename (optional)</label>
                  <input
                    id="crypto-image"
                    type="text"
                    value={cryptoImageFilename}
                    onChange={(event) =>
                      setCryptoImageFilename(event.target.value)
                    }
                    maxLength={255}
                    placeholder="bitcoin.png"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="client-submit-button"
                disabled={cryptoSaving}
              >
                {cryptoSaving
  ? editingCrypto
    ? 'Updating...'
    : 'Creating...'
  : editingCrypto
    ? 'Update cryptocurrency'
    : 'Create cryptocurrency'}
              </button>
            </form>
          </section>
        )}

                <div className="crypto-management-sections">

  <section className="client-form-panel crypto-quote-panel">
    <div className="client-panel-heading">
            <h2>Add price quote</h2>
            <p>Record a simulated market price for a cryptocurrency.</p>
          </div>

          <form onSubmit={handleQuoteSubmit}>
            <div className="client-form-grid">
              <div className="form-field">
                <label htmlFor="quote-crypto">Cryptocurrency</label>
                <select
                  id="quote-crypto"
                  value={quoteCryptoId}
                  onChange={(event) => setQuoteCryptoId(event.target.value)}
                  required
                >
                  <option value="">Choose a cryptocurrency</option>
                  {cryptos.map((crypto) => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="quote-price">Price (€)</label>
                <input
                  id="quote-price"
                  type="number"
                  min="0.00000001"
                  step="any"
                  value={quotePrice}
                  onChange={(event) => setQuotePrice(event.target.value)}
                  placeholder="65000.00"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="quote-date">Quote date</label>
                <input
                  id="quote-date"
                  type="date"
                  value={quoteDate}
                  onChange={(event) => setQuoteDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="client-submit-button"
              disabled={quoteSaving || cryptos.length === 0}
            >
              {quoteSaving ? 'Saving quote...' : 'Add price quote'}
            </button>
          </form>
        </section>

            <section className="client-list-panel crypto-history-panel">
          <div className="client-list-heading">
            <div>
              <h2>Historical price chart</h2>
              <p>Explore the last 30 recorded quotes for a cryptocurrency.</p>
            </div>
          </div>

          <div className="crypto-history-controls">
            <label htmlFor="crypto-history-select">
              Select cryptocurrency
            </label>

            <select
              id="crypto-history-select"
              value={selectedCryptoId}
              onChange={(event) => {
                const cryptoId = event.target.value
                setSelectedCryptoId(cryptoId)
                loadCryptoHistory(cryptoId)
              }}
            >
              <option value="">Choose a cryptocurrency</option>

              {cryptos.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>

          {historyLoading && <p>Loading historical quotes...</p>}

          {historyError && (
            <div className="alert alert-error" role="alert">
              {historyError}
            </div>
          )}

          {!historyLoading &&
            !historyError &&
            selectedCryptoId &&
            cryptoHistory.length < 2 && (
              <p className="client-empty-state">
                Not enough historical quotes to draw a chart.
              </p>
            )}

          {!historyLoading &&
            !historyError &&
            cryptoHistory.length >= 2 &&
            (() => {
              const width = 760
              const height = 280
              const paddingLeft = 85
              const paddingRight = 24
              const paddingTop = 24
              const paddingBottom = 42

              const prices = cryptoHistory.map((quote) =>
                Number(quote.price),
              )

              const minPrice = Math.min(...prices)
              const maxPrice = Math.max(...prices)
              const actualRange = maxPrice - minPrice
              const priceRange = actualRange || 1

              const chartMin =
                actualRange === 0
                  ? Math.max(0, minPrice - 1)
                  : Math.max(0, minPrice - actualRange * 0.12)

              const chartMax =
                actualRange === 0
                  ? maxPrice + 1
                  : maxPrice + actualRange * 0.12

              const displayRange = chartMax - chartMin || 1
              const chartWidth = width - paddingLeft - paddingRight
              const chartHeight = height - paddingTop - paddingBottom

              const getY = (price) =>
                paddingTop +
                ((chartMax - price) / displayRange) * chartHeight

              const points = prices
                .map((price, index) => {
                  const x =
                    paddingLeft +
                    (index / (prices.length - 1)) * chartWidth

                  return `${x},${getY(price)}`
                })
                .join(' ')

              const firstPrice = prices[0]
              const latestPrice = prices[prices.length - 1]
              const change = latestPrice - firstPrice
              const changePercent =
                firstPrice !== 0 ? (change / firstPrice) * 100 : 0

              const formatPrice = (price) =>
                `\u20AC${price.toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}`

              const formatDate = (date) =>
                new Date(date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                  timeZone: 'UTC',
                })

              return (
                <div className="crypto-chart-container">
                  <div className="crypto-chart-summary">
                    <div>
                      <span>Latest price</span>
                      <strong>{formatPrice(latestPrice)}</strong>
                    </div>

                    <div>
                      <span>Change over period</span>
                      <strong
                        className={
                          change >= 0
                            ? 'crypto-positive'
                            : 'crypto-negative'
                        }
                      >
                        {change >= 0 ? '+' : ''}
                        {formatPrice(change)}
                        {' '}(
                        {changePercent >= 0 ? '+' : ''}
                        {changePercent.toFixed(2)}%)
                      </strong>
                    </div>
                  </div>

                  <div className="crypto-chart-scroll">
                    <svg
                      className="crypto-history-chart"
                      viewBox={`0 0 ${width} ${height}`}
                      role="img"
                      aria-label="Historical cryptocurrency prices over time"
                      style={{
                        display: 'block',
                        width: '100%',
                        minWidth: '560px',
                        height: 'auto',
                        overflow: 'visible',
                      }}
                    >
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y =
                          paddingTop + (step / 4) * chartHeight

                        const price =
                          chartMax - (step / 4) * displayRange

                        return (
                          <g key={step}>
                            <line
                              x1={paddingLeft}
                              y1={y}
                              x2={width - paddingRight}
                              y2={y}
                              stroke="#dce4ec"
                              strokeWidth="1"
                              strokeDasharray="4 5"
                            />

                            <text
                              x={paddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              fill="#64748b"
                              fontSize="11"
                            >
                              {formatPrice(price)}
                            </text>
                          </g>
                        )
                      })}

                      <polyline
                        points={points}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />

                      <circle
                        cx={width - paddingRight}
                        cy={getY(latestPrice)}
                        r="5"
                        fill="#16a34a"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />

                      <text
                        x={paddingLeft}
                        y={height - 12}
                        fill="#64748b"
                        fontSize="11"
                      >
                        {formatDate(cryptoHistory[0].quoteDate)}
                      </text>

                      <text
                        x={width - paddingRight}
                        y={height - 12}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="11"
                      >
                        {formatDate(
                          cryptoHistory[cryptoHistory.length - 1].quoteDate,
                        )}
                      </text>
                    </svg>
                  </div>

                  <p className="history-disclaimer">
                    Historical simulated prices are for educational use only.
                  </p>
                </div>
              )
            })()}
        </section>

<section className="client-list-panel crypto-list-panel">
           <div className="client-list-heading">
            <div>
              <h2>Cryptocurrencies</h2>
              <p>{cryptos.length} listed</p>
            </div>

            <div className="client-list-actions">
              <button
                type="button"
                className="client-secondary-button"
                onClick={loadCryptos}
                disabled={cryptosLoading}
              >
                {cryptosLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {cryptosLoading && cryptos.length === 0 ? (
            <p>Loading cryptocurrencies...</p>
          ) : cryptos.length === 0 ? (
            <p className="client-empty-state">
              No cryptocurrencies found.
            </p>
          ) : (
            <div className="client-table-wrapper">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Latest price</th>
                    <th>Quote date</th>
                    <th>Logo</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {cryptos.map((crypto) => (
                    <tr key={crypto.id}>
                      <td>{crypto.name}</td>
                      <td>{crypto.symbol}</td>
                      <td>
                        {crypto.latestPrice == null
                          ? 'No quote yet'
                          : Number(crypto.latestPrice).toLocaleString(
                              'en-GB',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 8,
                              },
                            )}
                      </td>
                      <td>
  {crypto.quoteDate
    ? new Date(crypto.quoteDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—'}
</td>
<td className="admin-crypto-image-cell">
  {crypto.imageFilename ? (
    <img
      src={`/images/crypto/${crypto.imageFilename}`}
      alt={`${crypto.name} logo`}
      className="admin-crypto-table-logo"
    />
  ) : (
    '—'
  )}
</td>
<td>
  <div className="client-row-actions">
    <button
      type="button"
      className="client-secondary-button"
      onClick={() => handleEditCrypto(crypto)}
    >
      Edit
    </button>

    <button
      type="button"
      className="client-deactivate-button"
      onClick={() => handleDeleteCrypto(crypto)}
    >
      Delete
    </button>
  </div>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</section>
</div>
</div>
)
}

  function renderAdminDashboard() {
    return (
      <main className="admin-page">
        <div className="admin-layout">
          {renderAdminSidebar()}

          <div className="admin-main">
            {renderAdminTopbar()}
            
            {adminView === 'clients' ? (
  renderClientManagement()
) : adminView === 'cryptos' ? (
  renderCryptoManagement()
) : adminView === 'profile' ? (
  renderProfileManagement()
) : (
  renderAdminDashboardContent()
)}
          </div>
        </div>
      </main>
    )
  }

  function renderAdminDashboardContent() {
    return (
      <section className="admin-content" id="dashboard">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Administration workspace</p>
            <h1>Dashboard</h1>
            <p className="admin-page-subtitle">
              Welcome back. Manage your platform and monitor the available
              cryptocurrency services.
            </p>
          </div>
          <div className="admin-active-badge">
            <span />
            Administrator account active
          </div>
        </div>

        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}

        <section className="admin-welcome-panel">
          <div className="admin-welcome-content">
            <div className="admin-welcome-label">BITCHEST / ADMINISTRATION</div>
            <h2>Welcome to your workspace</h2>
            <p>
              Manage client accounts, explore the cryptocurrency market, and
              oversee the features available in this academic prototype.
            </p>
            <div className="admin-welcome-actions">
              <button
                className="admin-primary-action"
                type="button"
                onClick={openClientManagement}
              >
                Manage clients
              </button>
              <span className="admin-secondary-action">
                Crypto market - next step
              </span>
            </div>
          </div>
        </section>

        <div className="admin-section-heading">
          <h2>Platform overview</h2>
          <span>Available features</span>
        </div>

        <div className="admin-overview-grid">
          <button
            className="admin-overview-card admin-overview-card-button"
            type="button"
            onClick={openClientManagement}
          >
            <div className="admin-card-top">
              <div className="admin-card-icon">C</div>
              <span className="admin-card-type">Management</span>
            </div>
            <h3>Client management</h3>
            <p>
              Create client accounts, update details, and manage account access.
            </p>
            <div className="admin-card-action">
              <span>Open client management</span>
              <span>-&gt;</span>
            </div>
          </button>

          <article className="admin-overview-card">
            <div className="admin-card-top">
              <div className="admin-crypto-logo-list">
  <img src="/images/crypto/bitcoin.png" alt="Bitcoin" />
  <img src="/images/crypto/ethereum.png" alt="Ethereum" />
  <img src="/images/crypto/ripple.png" alt="Ripple" />
  <img src="/images/crypto/bitcoin-cash.png" alt="Bitcoin Cash" />
  <img src="/images/crypto/cardano.png" alt="Cardano" />
  <img src="/images/crypto/litecoin.png" alt="Litecoin" />
  <img src="/images/crypto/nem.png" alt="NEM" />
  <img src="/images/crypto/stellar.png" alt="Stellar" />
  <img src="/images/crypto/iota.png" alt="IOTA" />
  <img src="/images/crypto/dash.png" alt="Dash" />
</div>
              <span className="admin-card-type">Market</span>
            </div>
            <h3>Cryptocurrency market</h3>
            <p>
              Explore supported cryptocurrencies, simulated prices, and
              historical charts.
            </p>
            <div className="admin-card-action">
              <span>Frontend connection pending</span>
              <span>-&gt;</span>
            </div>
          </article>

          <article className="admin-overview-card">
            <div className="admin-card-top">
              <div className="admin-card-icon purple">H</div>
              <span className="admin-card-type">Data</span>
            </div>
            <h3>Historical quotes</h3>
            <p>
              Simulated historical quote records support market charts and
              price-change demonstrations.
            </p>
            <div className="admin-card-action">
              <span>Market data feature</span>
              <span>OK</span>
            </div>
          </article>
        </div>

        <aside className="admin-prototype-notice">
          <div className="admin-notice-icon">i</div>
          <div>
            <div className="admin-notice-title">Academic prototype notice</div>
            <p>
              BitChest is a demonstration application. Cryptocurrency prices
              and transactions are simulated. No real cryptocurrency purchases,
              sales, or transfers take place.
            </p>
          </div>
        </aside>

        <footer className="admin-footer">
          <span>Copyright {new Date().getFullYear()} BitChest</span>
          <span>Academic prototype - Administration workspace</span>
        </footer>
      </section>
    )
  }
   
   function handleTradeSubmit(event) {
  event.preventDefault()
  setWalletError('')
  setWalletMessage('')

  if (!tradeCryptoId) {
    setWalletError('Please select a cryptocurrency.')
    return
  }

  if (
    !tradeQuantity.trim() ||
    !Number.isFinite(Number(tradeQuantity)) ||
    Number(tradeQuantity) <= 0
  ) {
    setWalletError('Enter a valid quantity greater than zero.')
    return
  }

  const selectedCrypto = cryptos.find(
    (crypto) => crypto.id === tradeCryptoId,
  )

  if (!selectedCrypto || selectedCrypto.latestPrice == null) {
    setWalletError('No price quote is available for this cryptocurrency.')
    return
  }

  const price = Number(selectedCrypto.latestPrice)
  const quantity = Number(tradeQuantity)
  const total = Number((price * quantity).toFixed(2))
  const currentBalance = Number(walletData?.euroBalance || 0)

  if (!Number.isFinite(price) || price <= 0 || total < 0.01) {
    setWalletError('The transaction total must be at least €0.01.')
    return
  }

  const existingHolding = walletData?.holdings?.find(
    (holding) => holding.crypto.id === tradeCryptoId,
  )

  const currentQuantity = Number(existingHolding?.quantity || 0)

  setTradeConfirmation({
    crypto: selectedCrypto,
    cryptoId: tradeCryptoId,
    type: tradeType,
    quantity,
    quantityText: tradeQuantity.trim(),
    price,
    total,
    balanceBefore: currentBalance,
    balanceAfter:
      tradeType === 'BUY'
        ? Number((currentBalance - total).toFixed(2))
        : Number((currentBalance + total).toFixed(2)),
    holdingBefore: currentQuantity,
    holdingAfter:
      tradeType === 'BUY'
        ? currentQuantity + quantity
        : currentQuantity - quantity,
  })
}

async function confirmTrade() {
  if (!tradeConfirmation || tradeSaving) return

  setTradeSaving(true)
  setWalletError('')

  try {
    const data = await apiRequest('/wallet/trade', {
      method: 'POST',
      body: JSON.stringify({
      cryptoId: tradeConfirmation.cryptoId,
      type: tradeConfirmation.type,
      quantity: tradeConfirmation.quantityText,
      }),
    })

    setWalletMessage(
      data.message || 'Your transaction was completed successfully.',
    )

    setTradeQuantity('')
    setTradeConfirmation(null)

    await loadWalletData()
  } catch (err) {
    setWalletError(err.message || 'Unable to complete the transaction.')
  } finally {
    setTradeSaving(false)
  }
}

   function renderClientMarket() {
    const formatPrice = (value) =>
      value == null || value === ''
        ? 'No quote yet'
        : new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          }).format(Number(value))

    const formatDate = (value) =>
      value
        ? new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : '—'

    const prices = cryptoHistory.map((quote) => Number(quote.price))
    const hasChart = prices.length >= 2
    const width = 760
    const height = 280
    const padding = 35

    const minPrice = hasChart ? Math.min(...prices) : 0
    const maxPrice = hasChart ? Math.max(...prices) : 1
    const range = maxPrice - minPrice || 1

    const points = hasChart
      ? prices
          .map((price, index) => {
            const x =
              padding +
              (index / (prices.length - 1)) * (width - padding * 2)
            const y =
              height -
              padding -
              ((price - minPrice) / range) * (height - padding * 2)

            return `${x},${y}`
          })
          .join(' ')
      : ''

    return (
<section id="client-crypto-market" className="admin-content client-management-content crypto-market-page">
          <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">CLIENT WORKSPACE</p>
            <h1>Cryptocurrency market</h1>
            <p className="admin-page-subtitle">
              Explore available cryptocurrencies and their simulated prices.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadCryptos}
            disabled={cryptosLoading}
          >
            {cryptosLoading ? 'Refreshing...' : 'Refresh market'}
          </button>
        </div>

        {cryptoError && (
          <div className="alert alert-error" role="alert">
            {cryptoError}
          </div>
        )}

        <section className="client-list-panel">
          <div className="client-list-heading">
            <div>
              <h2>Available cryptocurrencies</h2>
              <p>{cryptos.length} listed</p>
            </div>
          </div>

          {cryptosLoading && cryptos.length === 0 ? (
            <p>Loading cryptocurrencies...</p>
          ) : cryptos.length === 0 ? (
            <p className="client-empty-state">
              No cryptocurrencies are currently available.
            </p>
          ) : (
            <div className="client-table-wrapper">
              <table className="client-table">
                <thead>
                  <tr>
  <th>Logo</th>
  <th>Name</th>
  <th>Symbol</th>
  <th>Latest price</th>
  <th>Quote date</th>
</tr>
                </thead>
                <tbody>
                  {cryptos.map((crypto) => (



                    <tr key={crypto.id}>
  <td className="client-crypto-image-cell">
    {crypto.imageFilename ? (
      <img
        src={`/images/crypto/${crypto.imageFilename}`}
        alt={`${crypto.name} logo`}
        className="client-crypto-table-logo"
      />
    ) : (
      '—'
    )}
  </td>
  <td>{crypto.name}</td>
  <td>{crypto.symbol}</td>
  <td>{formatPrice(crypto.latestPrice)}</td>
  <td>{formatDate(crypto.quoteDate)}</td>
</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="client-list-panel crypto-history-panel">
          <div className="client-list-heading">
            <div>
              <h2>Historical price chart</h2>
              <p>Explore recorded prices for a selected cryptocurrency.</p>
            </div>
          </div>

          <div className="crypto-history-controls">
            <label htmlFor="client-market-crypto">
              Select cryptocurrency
            </label>
            <select
              id="client-market-crypto"
              value={clientMarketCryptoId}
              onChange={(event) => {
                const cryptoId = event.target.value
                setClientMarketCryptoId(cryptoId)
                loadCryptoHistory(cryptoId)
              }}
            >
              <option value="">Choose a cryptocurrency</option>
              {cryptos.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>

          {historyLoading && <p>Loading historical quotes...</p>}

          {historyError && (
            <div className="alert alert-error" role="alert">
              {historyError}
            </div>
          )}

          {!historyLoading &&
            !historyError &&
            clientMarketCryptoId &&
            cryptoHistory.length < 2 && (
              <p className="client-empty-state">
                Not enough historical quotes to draw a chart.
              </p>
            )}

          {!historyLoading && !historyError && hasChart && (
            <div className="crypto-chart-container">
              <div className="crypto-chart-summary">
                <div>
                  <span>Latest price</span>
                  <strong>{formatPrice(prices[prices.length - 1])}</strong>
                </div>
                <div>
                  <span>First recorded price</span>
                  <strong>{formatPrice(prices[0])}</strong>
                </div>
              </div>

              <div className="crypto-chart-scroll">
                <svg
                  className="crypto-history-chart"
                  viewBox={`0 0 ${width} ${height}`}
                  role="img"
                  aria-label="Historical cryptocurrency prices"
                  style={{
                    display: 'block',
                    width: '100%',
                    minWidth: '560px',
                    height: 'auto',
                  }}
                >
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <p className="history-disclaimer">
                Historical simulated prices are for educational use only.
              </p>
            </div>
          )}
        </section>
      </section>
    )
  }

  function renderClientDashboard() {
    const euro = (value) =>
      value == null || value === ''
        ? '—'
        : new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'EUR',
          }).format(Number(value))

    const quantity = (value) =>
      value == null || value === ''
        ? '—'
        : Number(value).toLocaleString('en-GB', {
            maximumFractionDigits: 8,
          })

    const percentage = (value) =>
      value == null || value === ''
        ? '—'
        : `${Number(value).toFixed(2)}%`

    const holdings = Array.isArray(walletData?.holdings)
      ? walletData.holdings
      : []
    const portfolioValue = holdings.reduce(
      (total, holding) => total + Number(holding.estimatedValue || 0),
      0,
    )

    function renderClientHome() {
      return (
        <section className="admin-content" id="client-dashboard">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">CLIENT WORKSPACE</p>
              <h1>Dashboard</h1>
              <p className="admin-page-subtitle">
                Welcome back, {user?.firstName || 'BitChest user'}. Here is an overview of your simulated portfolio.
              </p>
            </div>
            <div className="admin-active-badge"><span />Client account</div>
          </div>

          {walletError && <div className="alert alert-error" role="alert">{walletError}</div>}
          {walletLoading && !walletData ? (
            <article className="wallet-panel"><p>Loading your account overview...</p></article>
          ) : (
            <>
              <div className="wallet-summary-grid">
                <article className="wallet-summary-card wallet-balance-card">
                  <span className="wallet-card-label">Available balance</span>
                  <strong>{euro(walletData?.euroBalance)}</strong>
                  <span className="wallet-card-note">Funds available for simulated purchases</span>
                </article>
                <article className="wallet-summary-card">
                  <span className="wallet-card-label">Portfolio value</span>
                  <strong>{euro(portfolioValue)}</strong>
                  <span className="wallet-card-note">Current estimated value of your holdings</span>
                </article>
                <article className="wallet-summary-card">
                  <span className="wallet-card-label">Holdings</span>
                  <strong>{holdings.length}</strong>
                  <span className="wallet-card-note">Cryptocurrencies in your portfolio</span>
                </article>
                <article className="wallet-summary-card">
                  <span className="wallet-card-label">Transactions</span>
                  <strong>{walletTransactions.length}</strong>
                  <span className="wallet-card-note">Recorded purchases and sales</span>
                </article>
              </div>

              <section className="admin-content" style={{ padding: 0 }}>
                <div className="admin-page-heading">
                  <div><h2>Quick actions</h2><p className="admin-page-subtitle">Continue to one of your account sections.</p></div>
                </div>
                <div className="admin-welcome-actions">
                  <button className="admin-primary-action" type="button" onClick={() => setClientView('wallet')}>Open my wallet</button>
                  <button className="secondary-button" type="button" onClick={() => { setClientView('market'); loadCryptos() }}>Explore crypto market</button>
                  <button className="secondary-button" type="button" onClick={() => { setClientView('profile'); loadProfile() }}>Manage my profile</button>
                </div>
              </section>
            </>
          )}
        </section>
      )
    }

    return (
      <main className="admin-page">
        <div className="admin-layout">
          {renderClientSidebar()}
          <div className="admin-main">
            <header className="admin-topbar">
              <div className="admin-topbar-heading">
                <div className="admin-topbar-title">My BitChest</div>
                <div className="admin-topbar-caption">Personal portfolio and cryptocurrency services</div>
              </div>
              <div className="admin-topbar-account">
  <div className="client-topbar-balance">
    <span>Available balance</span>
    <strong>
      {walletData ? euro(walletData.euroBalance) : '—'}
    </strong>
  </div>

  <div className="admin-avatar" aria-hidden="true">{initials}</div>
  <div className="admin-account-details">
    <div className="admin-account-role">Client</div>
    <span className="admin-account-email">{user?.email}</span>
  </div>
  <button className="admin-logout-button" type="button" onClick={handleLogout}>Log out</button>
</div>
            </header>

            {clientView === 'dashboard' ? renderClientHome() :
              clientView === 'wallet' ? (
                <>
            <section className="dashboard-content wallet-content" id="client-wallet">
          <p className="eyebrow">CLIENT AREA</p>
          <h1>Welcome, {user?.firstName || 'BitChest user'}</h1>
          <p className="dashboard-subtitle">
            Manage your simulated cryptocurrency portfolio.
          </p>

          {message && (
            <div className="alert alert-success" role="status">
              {message}
            </div>
          )}

          {walletMessage && (
            <div className="alert alert-success" role="status">
              {walletMessage}
            </div>
          )}

          {walletError && (
            <div className="alert alert-error" role="alert">
              {walletError}
            </div>
          )}

          {walletLoading && !walletData ? (
            <article className="account-card">
              <p>Loading your wallet...</p>
            </article>
          ) : walletData ? (
            <>
              <div className="wallet-summary-grid">
                <article className="wallet-summary-card wallet-balance-card">
                  <span className="wallet-card-label">Available balance</span>
                  <strong>{euro(walletData.euroBalance)}</strong>
                  <span className="wallet-card-note">
                    Funds available for simulated purchases
                  </span>
                </article>

                <article className="wallet-summary-card">
                  <span className="wallet-card-label">Holdings</span>
                  <strong>
                    {Array.isArray(walletData.holdings)
                      ? walletData.holdings.length
                      : 0}
                  </strong>
                  <span className="wallet-card-note">
                    Cryptocurrencies in your portfolio
                  </span>
                </article>

                <article className="wallet-summary-card">
                  <span className="wallet-card-label">
                    Recent transactions
                  </span>
                  <strong>{walletTransactions.length}</strong>
                  <span className="wallet-card-note">
                    Transactions shown below
                  </span>
                </article>
              </div>

              <article className="wallet-panel">
                <div className="wallet-panel-heading">
                  <div>
                    <h2>My portfolio</h2>
                    <p>Your holdings and their latest simulated values.</p>
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={loadWalletData}
                    disabled={walletLoading}
                  >
                    {walletLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {walletData.holdings?.length ? (
                  <div className="wallet-table-wrap">
                    <table className="wallet-table">
                      <thead>
                        <tr>
                          <th>Cryptocurrency</th>
                          <th>Quantity</th>
                          <th>Latest price</th>
                          <th>Estimated value</th>
                          <th>Average purchase</th>
                          <th>Unrealized P/L</th>
                          <th>P/L %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletData.holdings.map((holding) => (
                          <tr key={holding.crypto.id}>
                            <td>
                              <div className="wallet-crypto-name">
                                <strong>{holding.crypto.name}</strong>
                                <span>{holding.crypto.symbol}</span>
                              </div>
                            </td>
                            <td>{quantity(holding.quantity)}</td>
                            <td>{euro(holding.latestPrice)}</td>
                            <td>{euro(holding.estimatedValue)}</td>
                            <td>{euro(holding.averagePurchasePrice)}</td>
                            <td
                              className={
                                Number(holding.unrealizedProfitLoss) > 0
                                  ? 'wallet-positive'
                                  : Number(holding.unrealizedProfitLoss) < 0
                                    ? 'wallet-negative'
                                    : ''
                              }
                            >
                              {euro(holding.unrealizedProfitLoss)}
                            </td>
                            <td
                              className={
                                Number(
                                  holding.unrealizedProfitLossPercentage,
                                ) > 0
                                  ? 'wallet-positive'
                                  : Number(
                                      holding.unrealizedProfitLossPercentage,
                                    ) < 0
                                    ? 'wallet-negative'
                                    : ''
                              }
                            >
                              {percentage(
                                holding.unrealizedProfitLossPercentage,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="wallet-empty">
                    You do not own any cryptocurrencies yet. You can make
                    your first simulated purchase below.
                  </p>
                )}
              </article>

              <article className="wallet-panel">
                <div className="wallet-panel-heading">
                  <div>
                    <h2>Buy or sell</h2>
                    <p>
                      Transactions use the latest available simulated price.
                    </p>
                  </div>
                </div>

                <form
                  className="wallet-trade-form"
                  onSubmit={handleTradeSubmit}
                >
                  <div className="wallet-form-field">
                    <label htmlFor="trade-type">Transaction type</label>
                    <select
                      id="trade-type"
                      value={tradeType}
                      onChange={(event) => setTradeType(event.target.value)}
                    >
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </select>
                  </div>

                  <div className="wallet-form-field">
                    <label htmlFor="trade-crypto">
                      Cryptocurrency
                    </label>
                    <select
                      id="trade-crypto"
                      value={tradeCryptoId}
                      onChange={(event) =>
                        setTradeCryptoId(event.target.value)
                      }
                      required
                    >
                      <option value="">Select a cryptocurrency</option>
                      {cryptos.map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="wallet-form-field">
                    <label htmlFor="trade-quantity">Quantity</label>
                    <input
                      id="trade-quantity"
                      type="number"
                      min="0.00000001"
                      step="0.00000001"
                      value={tradeQuantity}
                      onChange={(event) =>
                        setTradeQuantity(event.target.value)
                      }
                      placeholder="e.g. 0.01"
                      required
                    />
                  </div>

                  <button
                    className="primary-button wallet-trade-button"
                    type="submit"
                    disabled={tradeSaving || walletLoading || !cryptos.length}
                  >
                    {tradeSaving
                      ? 'Processing...'
                      : tradeType === 'BUY'
                        ? 'Buy cryptocurrency'
                        : 'Sell cryptocurrency'}
                  </button>
                </form>

                {!cryptos.length && (
                  <p className="wallet-empty">
                    No cryptocurrencies are available at the moment.
                  </p>
                )}
              </article>

              <article className="wallet-panel">
                <div className="wallet-panel-heading">
                  <div>
                    <h2>Transaction history</h2>
                    <p>Your latest simulated purchases and sales.</p>
                  </div>
                </div>

                {walletTransactions.length ? (
                  <div className="wallet-table-wrap">
                    <table className="wallet-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Cryptocurrency</th>
                          <th>Quantity</th>
                          <th>Price per unit</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>
                              {transaction.createdAt
                                ? new Date(
                                    transaction.createdAt,
                                  ).toLocaleString()
                                : '—'}
                            </td>
                            <td>
                              <span
                                className={
                                  transaction.type === 'BUY'
                                    ? 'wallet-transaction-buy'
                                    : 'wallet-transaction-sell'
                                }
                              >
                                {transaction.type}
                              </span>
                            </td>
                            <td>
                              {transaction.crypto
                                ? `${transaction.crypto.name} (${transaction.crypto.symbol})`
                                : '—'}
                            </td>
                            <td>{quantity(transaction.quantity)}</td>
                            <td>{euro(transaction.pricePerUnit)}</td>
                            <td>{euro(transaction.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="wallet-empty">
                    No transactions have been recorded yet.
                  </p>
                )}
              </article>
            </>
          ) : (
            <article className="wallet-panel">
              <h2>Your wallet could not be displayed.</h2>
              <p>
                Check the error above and try refreshing the page.
              </p>
              <button
                className="secondary-button"
                type="button"
                onClick={loadWalletData}
                disabled={walletLoading}
              >
                Try again
              </button>
            </article>
          )}

          <article className="account-card wallet-account-card">
            <h2>Account information</h2>
            <p><strong>Name:</strong> {fullName}</p>
            <p><strong>Email:</strong> {user?.email || '-'}</p>
            <p><strong>Role:</strong> Client</p>
          </article>

          <p className="wallet-disclaimer">
            BitChest is an academic simulation. Prices and transactions are
            simulated; no real cryptocurrency is purchased or sold.
          </p>
        </section>
                </>
              ) : clientView === 'market' ? renderClientMarket() :
              clientView === 'profile' ? renderProfileManagement() : renderClientHome()}
          </div>
        </div>
      </main>
    )
  }

  async function handleConfirmDialog() {
  if (!confirmationDialog || confirmationLoading) return

  setConfirmationLoading(true)

  try {
    await confirmationDialog.onConfirm()
    setConfirmationDialog(null)
  } finally {
    setConfirmationLoading(false)
  }
}

  if (!token || !user) {
    return renderLogin()
  }

  if (mustChangePassword) {
    return renderPasswordChange()
  }

  return (
  <>
    {isAdmin ? renderAdminDashboard() : renderClientDashboard()}

    {confirmationDialog && (
      <div className="confirmation-overlay">
        <div
          className="confirmation-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
        >
          <div className="confirmation-dialog-icon">
            !
          </div>

          <h2 id="confirmation-title">
            {confirmationDialog.title}
          </h2>

          <p>{confirmationDialog.message}</p>

          <div className="confirmation-dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirmationDialog(null)}
              disabled={confirmationLoading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="confirmation-delete-button"
              onClick={handleConfirmDialog}
              disabled={confirmationLoading}
            >
              {confirmationLoading
                ? 'Processing...'
                : confirmationDialog.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    )}
        {tradeConfirmation && (
      <div className="trade-confirmation-overlay">
        <div
          className="trade-confirmation-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trade-confirmation-title"
        >
          <h2 id="trade-confirmation-title">
            {tradeConfirmation.type === 'BUY'
              ? 'Review your purchase'
              : 'Review your sale'}
          </h2>

          <p className="trade-confirmation-intro">
            Please check the transaction details before confirming.
          </p>

          <div className="trade-confirmation-details">
            <div>
              <span>Cryptocurrency</span>
              <strong>
                {tradeConfirmation.crypto.name} ({tradeConfirmation.crypto.symbol})
              </strong>
            </div>

            <div>
              <span>Quantity</span>
              <strong>
                {tradeConfirmation.quantity.toLocaleString('en-GB', {
                  maximumFractionDigits: 8,
                })}
              </strong>
            </div>

            <div>
              <span>Unit price</span>
              <strong>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(tradeConfirmation.price)}
              </strong>
            </div>

            <div>
              <span>
                {tradeConfirmation.type === 'BUY'
                  ? 'Estimated purchase total'
                  : 'Estimated sale proceeds'}
              </span>
              <strong>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(tradeConfirmation.total)}
              </strong>
            </div>

            <div>
              <span>Euro balance before</span>
              <strong>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(tradeConfirmation.balanceBefore)}
              </strong>
            </div>

            <div>
              <span>Euro balance after</span>
              <strong>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(tradeConfirmation.balanceAfter)}
              </strong>
            </div>

            {tradeConfirmation.type === 'SELL' && (
              <>
                <div>
                  <span>Current quantity owned</span>
                  <strong>
                    {tradeConfirmation.holdingBefore.toLocaleString('en-GB', {
                      maximumFractionDigits: 8,
                    })}
                  </strong>
                </div>

                <div>
                  <span>Remaining quantity after sale</span>
                  <strong>
                    {tradeConfirmation.holdingAfter.toLocaleString('en-GB', {
                      maximumFractionDigits: 8,
                    })}
                  </strong>
                </div>
              </>
            )}
          </div>

          <p className="trade-confirmation-note">
            This is an estimate based on the latest available price.
            The final transaction is validated by the server when you confirm.
          </p>

          <div className="trade-confirmation-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setTradeConfirmation(null)}
              disabled={tradeSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="trade-confirmation-submit"
              onClick={confirmTrade}
              disabled={tradeSaving}
            >
              {tradeSaving
                ? 'Processing...'
                : tradeConfirmation.type === 'BUY'
                  ? 'Confirm purchase'
                  : 'Confirm sale'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}

export default App