import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './VaccineManagement.css'

function VaccineManagement() {
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    batch_number: '',
    quantity: '',
    expiry_date: '',
    storage_temp: ''
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchVaccines()
  }, [])

  const fetchVaccines = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVaccines(data || [])
    } catch (error) {
      console.error('Error fetching vaccines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('vaccins')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        setEditingId(null)
      } else {
        const { error } = await supabase
          .from('vaccins')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        name: '',
        manufacturer: '',
        batch_number: '',
        quantity: '',
        expiry_date: '',
        storage_temp: ''
      })
      fetchVaccines()
    } catch (error) {
      console.error('Error saving vaccine:', error)
    }
  }

  const handleEdit = (vaccine) => {
    setFormData({
      name: vaccine.name,
      manufacturer: vaccine.manufacturer,
      batch_number: vaccine.batch_number,
      quantity: vaccine.quantity,
      expiry_date: vaccine.expiry_date,
      storage_temp: vaccine.storage_temp
    })
    setEditingId(vaccine.id)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vaccine?')) {
      try {
        const { error } = await supabase
          .from('vaccins')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchVaccines()
      } catch (error) {
        console.error('Error deleting vaccine:', error)
      }
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="vaccine-management">
      <h1>Vaccine Stock Management</h1>

      <form onSubmit={handleSubmit} className="vaccine-form">
        <h2>{editingId ? 'Edit Vaccine' : 'Add New Vaccine'}</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Manufacturer:</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Batch Number:</label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date:</label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Storage Temperature (°C):</label>
            <input
              type="number"
              step="0.1"
              name="storage_temp"
              value={formData.storage_temp}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <button type="submit">{editingId ? 'Update' : 'Add'} Vaccine</button>
        {editingId && (
          <button type="button" onClick={() => setEditingId(null)} className="cancel-btn">
            Cancel
          </button>
        )}
      </form>

      <div className="vaccines-list">
        <h2>Vaccine Inventory</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Manufacturer</th>
              <th>Batch Number</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              <th>Storage Temp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vaccines.map((vaccine) => (
              <tr key={vaccine.id}>
                <td>{vaccine.name}</td>
                <td>{vaccine.manufacturer}</td>
                <td>{vaccine.batch_number}</td>
                <td>{vaccine.quantity}</td>
                <td>{vaccine.expiry_date}</td>
                <td>{vaccine.storage_temp}°C</td>
                <td>
                  <button onClick={() => handleEdit(vaccine)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(vaccine.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VaccineManagement