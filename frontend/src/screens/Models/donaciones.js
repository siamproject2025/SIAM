// screens/Models/donaciones.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaBoxOpen } from 'react-icons/fa';

const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDonacion, setSelectedDonacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    id_almacen: '',
    fecha: '',
    cantidad_donacion: '',
    descripcion: '',
    tipo_donacion: 'Alimentos',
    observaciones: ''
  });

  const tiposDonacion = [
    'Alimentos',
    'Vestimenta',
    'Medicina',
    'Enseres',
    'Bebidas',
    'Útiles escolares',
    'Productos de higiene',
    'Otro'
  ];

  // Obtener todas las donaciones
  const fetchDonaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/donaciones');
      setDonaciones(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar las donaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonaciones();
  }, []);

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad_donacion: '',
      descripcion: '',
      tipo_donacion: 'Alimentos',
      observaciones: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (donacion) => {
    setModalMode('edit');
    setSelectedDonacion(donacion);
    setFormData({
      id_almacen: donacion.id_almacen,
      fecha: new Date(donacion.fecha).toISOString().split('T')[0],
      cantidad_donacion: donacion.cantidad_donacion,
      descripcion: donacion.descripcion || '',
      tipo_donacion: donacion.tipo_donacion,
      observaciones: donacion.observaciones || ''
    });
    setShowModal(true);
  };

  // Confirmar eliminación
  const handleDeleteConfirm = (donacion) => {
    setSelectedDonacion(donacion);
    setShowDeleteModal(true);
  };

  // Eliminar donación
  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/donaciones/${selectedDonacion.id_donacion}`);
      setSuccess('Donación eliminada exitosamente');
      fetchDonaciones();
      setShowDeleteModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la donación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDonacion(null);
    setError('');
    setSuccess('');
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar donación
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_almacen || !formData.fecha || !formData.cantidad_donacion) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      
      if (modalMode === 'create') {
        await axios.post('/api/donaciones', formData);
        setSuccess('Donación creada exitosamente');
      } else {
        await axios.put(`/api/donaciones/${selectedDonacion.id_donacion}`, formData);
        setSuccess('Donación actualizada exitosamente');
      }
      
      fetchDonaciones();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la donación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtener color del badge según tipo
  const getBadgeColor = (tipo) => {
    const colors = {
      'Alimentos': 'success',
      'Vestimenta': 'primary',
      'Medicina': 'danger',
      'Enseres': 'warning',
      'Bebidas': 'info',
      'Útiles escolares': 'secondary',
      'Productos de higiene': 'light',
      'Otro': 'dark'
    };
    return colors[tipo] || 'secondary';
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FaBoxOpen className="me-2" />
                Gestión de Donaciones
              </h2>
              <p className="text-muted">Administra todas las donaciones recibidas</p>
            </div>
            <Button 
              variant="primary" 
              onClick={handleCreate}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-2" />
              Nueva Donación
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              {loading && donaciones.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Cargando donaciones...</p>
                </div>
              ) : donaciones.length === 0 ? (
                <div className="text-center py-5">
                  <FaBoxOpen size={50} className="text-muted mb-3" />
                  <h5>No hay donaciones registradas</h5>
                  <p className="text-muted">Comienza agregando una nueva donación</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Almacén</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                        <th>Observaciones</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donaciones.map((donacion) => (
                        <tr key={donacion._id}>
                          <td>{donacion.id_donacion}</td>
                          <td>{donacion.id_almacen}</td>
                          <td>{formatDate(donacion.fecha)}</td>
                          <td>
                            <Badge bg={getBadgeColor(donacion.tipo_donacion)}>
                              {donacion.tipo_donacion}
                            </Badge>
                          </td>
                          <td className="text-end">{donacion.cantidad_donacion}</td>
                          <td>{donacion.descripcion || '-'}</td>
                          <td>{donacion.observaciones || '-'}</td>
                          <td className="text-center">
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(donacion)}
                              title="Editar"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteConfirm(donacion)}
                              title="Eliminar"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para Crear/Editar */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Nueva Donación' : 'Editar Donación'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ID Almacén <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="id_almacen"
                    value={formData.id_almacen}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Ingresa el ID del almacén"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Donación <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tipo_donacion"
                    value={formData.tipo_donacion}
                    onChange={handleChange}
                    required
                  >
                    {tiposDonacion.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="cantidad_donacion"
                    value={formData.cantidad_donacion}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Cantidad recibida"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe la donación recibida"
                maxLength={1000}
              />
              <Form.Text className="text-muted">
                {formData.descripcion.length}/1000 caracteres
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales"
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {formData.observaciones.length}/500 caracteres
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Guardando...
                  </>
                ) : (
                  modalMode === 'create' ? 'Crear Donación' : 'Actualizar Donación'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar esta donación?
          {selectedDonacion && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>ID:</strong> {selectedDonacion.id_donacion}<br />
              <strong>Tipo:</strong> {selectedDonacion.tipo_donacion}<br />
              <strong>Cantidad:</strong> {selectedDonacion.cantidad_donacion}
            </div>
          )}
          <p className="text-danger mt-3 mb-0">
            <strong>Esta acción no se puede deshacer.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Donaciones;