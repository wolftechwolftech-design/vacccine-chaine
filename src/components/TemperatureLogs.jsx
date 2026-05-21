import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { jsPDF } from 'jspdf'
import './TemperatureLogs.css'

function TemperatureLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    temperature: '',
    location: '',
    recorded_by: '',
    notes: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('releves')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching temperature logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('releves')
        .insert([{
          ...formData,
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      setFormData({
        temperature: '',
        location: '',
        recorded_by: '',
        notes: ''
      })
      fetchLogs()
    } catch (error) {
      console.error('Error saving temperature log:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const exportToPDF = () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      doc.setFontSize(16)
      doc.text('Rapport des relevés de température', 40, 40)
      doc.setFontSize(12)
      doc.text('Date/Heure', 40, 70)
      doc.text('Température (°C)', 220, 70)
      doc.text('Emplacement', 360, 70)

      let y = 90
      if (logs.length === 0) {
        doc.text('Aucun relevé disponible.', 40, y)
      } else {
        logs.forEach((log) => {
          const dateText = log.created_at ? new Date(log.created_at).toLocaleString() : ''
          const tempText = log.temperature != null ? log.temperature.toString() : ''
          const locationText = log.location || ''

          doc.text(dateText, 40, y)
          doc.text(tempText, 220, y)
          doc.text(locationText, 360, y)
          y += 20

          if (y > 760) {
            doc.addPage()
            y = 40
          }
        })
      }

      doc.save('rapport-temperature.pdf')
    } catch (error) {
      console.error('Error exporting temperature logs to PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="temperature-logs">
      <h1>Temperature Logs</h1>

      <form onSubmit={handleSubmit} className="log-form">
        <h2>Add New Temperature Reading</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Temperature (°C):</label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Fridge A, Freezer B"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Recorded By:</label>
            <input
              type="text"
              name="recorded_by"
              value={formData.recorded_by}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Optional notes"
              rows="2"
            />
          </div>
        </div>
        <button type="submit">Add Temperature Log</button>
      </form>

      <div className="logs-list">
        <h2>Temperature History</h2>
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Temperature (°C)</th>
              <th>Location</th>
              <th>Recorded By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td className={log.temperature < 2 || log.temperature > 8 ? 'warning' : ''}>
                  {log.temperature}°C
                </td>
                <td>{log.location}</td>
                <td>{log.recorded_by}</td>
                <td>{log.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={exportToPDF} disabled={isGenerating} className="export-btn">
          {isGenerating ? 'Génération...' : 'Exporter PDF'}
        </button>
      </div>
    </div>
  )
}

export default TemperatureLogs